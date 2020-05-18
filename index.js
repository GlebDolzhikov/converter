const readFilePromise = require('fs-readfile-promise');
var parser = require('xml2json');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

async function getXML(xmlPath) {
    const buffer = await readFilePromise(xmlPath);
    return JSON.parse(parser.toJson(buffer));
}

function createCSV(data, filename){
    const csvWriter = createCsvWriter({
        path: filename,
        header: [
            {id: 'sku', title: 'Sku'},
            {id: 'title', title: 'Title'},
            {id: 'price', title: 'Price'},
            {id: 'text', title: 'Text'},
            {id: 'photo', title: 'Photo'},
            {id: 'editions', title: 'Editions'},
            {id: 'category', title: 'Category'},
        ]
    });

    csvWriter.writeRecords(data)       // returns a promise
        .then(() => {
            console.log('...Done');
        });
}

async function main() {
    const pricesData = await getXML('./prices.xml');
    const descriptionsData = await getXML('./descriptions.xml');

    const prices = pricesData.yml_catalog.shop.offer;
    const descriptions = descriptionsData.yml_catalog.shop.offers.offer;
    const categories = descriptionsData.yml_catalog.shop.categories.category;

    const result = prices.map(item=> {
       const {barcode,name, vp_sku, RRP} = item;
       const correspondingDesc = descriptions.find(description => description.vp_sku === vp_sku);
       if( correspondingDesc){
           let editions;
           if (Array.isArray(correspondingDesc.param)){
               editions = correspondingDesc.param.reduce(((acc, cur)=> `${acc ? acc +';' : acc}${cur.name}:${cur['$t']}`),'')
           }
           const {categoryId, description} = correspondingDesc;
           const text = typeof description === "string" ? description : undefined;
           const categoryObj = categories.find(c=> c.id === categoryId)
           const category = categoryObj ? categoryObj['$t'] : undefined;
           const addons = {editions,category,text};

           return{
               sku: vp_sku,
               title: name,
               price: RRP,
               text: correspondingDesc.description,
               photo:correspondingDesc.picture,
               ...addons
           }
       }

    })
    const half_length = Math.ceil(result.length / 2);
    const part2 = result.splice(0,half_length);
    createCSV(result,'planeta.csv')
    createCSV(part2,'planeta2.csv')

};

main();

