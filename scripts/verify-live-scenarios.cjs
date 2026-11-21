// Real browser, existing servers, no interception or fixture. Run sequentially to respect quota.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const output = path.resolve(process.env.LIVE_OUTPUT_DIR || 'test-results/t222-live');
const facade = process.env.LIVE_FACADE_URL || 'http://localhost:4010';
const host = process.env.LIVE_HOST_URL || 'http://localhost:3000';
const pace = Math.max(15000, Math.min(60000, Number(process.env.LIVE_PACE_MS) || 20000));
const cases = [
  {id:'renting', prompts:[
    'I am practising renting a room. Help me choose between a quiet room and a room near public transport.',
    'Cháu muốn xem phòng trước, chưa quyết định thuê đâu ạ.',
    'Chiều mai cháu đến xem được không ạ?',
    'Cháu cảm ơn bác. Tạm biệt.'
  ]},
  {id:'market', prompts:[
    'Help me choose between mangoes and oranges for a small snack. I am practising shopping at the market.',
    'Cho một ký loại vừa chọn nhé.',
    'Cho mình xin một cái túi nhé.',
    'Cảm ơn, lần sau mình quay lại.'
  ]},
  {id:'neighbors', prompts:[
    'Chào bạn, mình mới chuyển đến đây.',
    'Gần đây có chỗ nào đi dạo không?',
    'Mình thích chỗ yên tĩnh để đi bộ buổi chiều.',
    'Cảm ơn nhé, mình về trước nhé.'
  ]}
];
const report = {status:'running',health:null,cases:[],error:null};
let browser, page;
const save = () => fs.writeFileSync(path.join(output,'report.json'),JSON.stringify(report,null,2));
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const {dialogueIssue,uiConversationIssue,isFarewell}=await import('../packages/ai-service-facade/src/dialogue-quality.ts');
  const {uiNeedsEnglish}=await import('../packages/ai-service-facade/src/response-quality.ts');
  report.health=await (await fetch(facade+'/health')).json();
  if(report.health.mode!=='llm' || report.health.dev!==false) throw new Error('Requires real LLM, dev=false');
  browser=await chromium.launch({executablePath:process.env.PW_CHROMIUM_PATH || undefined,headless:true});
  const selected = process.env.LIVE_SCENARIOS ? process.env.LIVE_SCENARIOS.split(',') : cases.map(c=>c.id);
  if(selected.some(id=>!cases.some(c=>c.id===id))) throw new Error('Unknown LIVE_SCENARIOS id');
  for(const scenario of cases.filter(c=>selected.includes(c.id))){
    if(report.cases.length) await new Promise(resolve=>setTimeout(resolve,pace));
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    page=await context.newPage(); page.setDefaultTimeout(15000);
    const result={id:scenario.id,turns:[],forms:[],submittedForms:0,status:'running'}; report.cases.push(result);
    const history=[]; const knownNames=new Set();
    const done=async(input)=>{
      await page.getByTestId('replying').waitFor({state:'hidden',timeout:90000});
      if(await page.getByTestId('chat-error').count()) throw new Error(scenario.id+': '+await page.getByTestId('chat-error').innerText());
      const speech=await page.getByTestId('agent-text').last().innerText();
      result.turns.push({input,speech}); save();
      const issue=dialogueIssue(speech,history,input);
      if(issue) throw new Error(scenario.id+': '+issue+': '+speech);
      if(/Interactive question:|"fields"\s*:|<\/?(?:vi|en|ui)>/.test(speech)) throw new Error('Protocol leaked');
      const forms=page.locator('form[data-testid="scenario-form"]');
      if(isFarewell(input) && await forms.count()) throw new Error('New form after goodbye');
      for(const form of await forms.all()){
        const title=await form.locator('h3').innerText();
        const description=await form.locator('[class~="chat:form-description"]').innerText();
        const options=await form.locator('[class~="chat:choice-text"],select option:not([value=""])').allTextContents();
        options.forEach(name=>knownNames.add(name));
        const labels=await form.locator('legend[class~="chat:field-label"]').allTextContents();
        const data={formId:'dom-check',title,description,submitLabel:await form.locator('button[type=submit]').innerText(),fields:labels.map((label,i)=>({id:'f'+i,label,kind:'choice',required:false,options}))};
        const formIssue=uiConversationIssue(data,[],input);
        if(formIssue) throw new Error(scenario.id+': UI '+formIssue);
        const explanations=await form.locator('[class~="chat:choice-description"],[class~="chat:fact-label"],[class~="chat:fact-value"],[class~="chat:choice-badge"]').allTextContents();
        if(uiNeedsEnglish({...data,title:[title,description,...explanations].join('\n'),fields:[{id:'check',label:'',kind:'choice',required:false,options:[...knownNames]}]})) throw new Error('Non-English visible explanations');
        result.forms.push({title,description,labels,options,explanations});
      }
      history.push({role:'user',text:input},{role:'assistant',text:speech});save();
    };
    await page.goto(host+'/chat?facade='+encodeURIComponent(facade)+'&streamTimeout=45000');
    await page.getByTestId('scenario-'+scenario.id).click();
    await page.getByTestId('agent-text').first().or(page.getByTestId('chat-error')).first().waitFor({timeout:90000});
    await done('');
    for(let i=0;i<scenario.prompts.length;i++){
      await page.waitForTimeout(pace);
      await page.getByLabel('Your reply').fill(scenario.prompts[i]);
      await page.getByTestId('send-button').click(); await done(scenario.prompts[i]);
      if(i===0){
        const form=page.locator('form[data-testid="scenario-form"]').last();
        if(await form.count()){
          const selected=new Set(); const answers=[];
          for(const control of await form.locator('select,input,textarea').all()){
            const tag=await control.evaluate(el=>el.tagName);
            const type=await control.getAttribute('type');
            if(tag==='SELECT') {const values=await control.locator('option').evaluateAll(xs=>xs.map(x=>x.value).filter(Boolean));await control.selectOption(values[0]);answers.push({value:values[0]});}
            else if(type==='radio'){const name=await control.getAttribute('name');if(!selected.has(name)){await control.check();selected.add(name);answers.push({value:await control.getAttribute('value')});}}
            else {await control.fill('Just exploring options for this practice.');answers.push({value:'Just exploring options for this practice.'});}
          }
          await form.screenshot({path:path.join(output,scenario.id+'-ui.png')});
          await page.waitForTimeout(pace);await form.locator('button[type=submit]').click();
          await done(JSON.stringify({type:'ui_response',answers})); result.submittedForms++;
        }
      }
    }
    await page.screenshot({path:path.join(output,scenario.id+'-conversation.png'),fullPage:true});
    result.status='passed';save();await context.close();page=null;
  }
  if(!report.cases.some(c=>c.submittedForms>0)) throw new Error('No generated UI was exercised in any scenario');
  report.status='passed';
})().catch(async error=>{
  report.status='failed'; report.error=error.message;process.exitCode=1;
  if(page) await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});
}).finally(async()=>{await browser?.close();save();console.log(JSON.stringify({status:report.status,error:report.error,report:path.join(output,'report.json')}));});
