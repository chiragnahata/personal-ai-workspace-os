const {fetchUrl}=require('./scrapers/httpClient'); const cheerio=require('cheerio');
(async ()=>{
  try{
    const html=await fetchUrl('https://www.buddy4study.com/scholarships');
    const $=cheerio.load(html);
    const matches=[];
    $('a').each((i,el)=>{
      const href=$(el).attr('href');
      const text=$(el).text().trim().replace(/\s+/g,' ');
      if(!href) return;
      if(/scholarship|page|scholarships|apply|deadline/i.test(href) || /scholarship|apply|deadline|scholarships/i.test(text)){
        try{ matches.push({href: new URL(href, 'https://www.buddy4study.com/scholarships').toString(), text}); }catch(e){}
      }
    });
    console.log('FOUND',matches.length);
    console.log(matches.slice(0,80).map(m=>JSON.stringify(m)).join('\n'));
  }catch(e){console.error('ERR',e.message)}
})();
