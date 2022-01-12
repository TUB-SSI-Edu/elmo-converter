// reqired property : test function
const requiredTemplateProperties = {
  keywords: obj => {return Array.isArray(obj) == true},
  Issuer: obj => typeof obj == 'function',
  CredentialSubject: obj => typeof obj == 'function',
  handleAchievements: obj => typeof obj == 'function'
}

// on startup
const templateDict = loadTemplates()

// path to mockCredential - later maybe dynmaicly created
const mockCredentialPath = "./mockCredential.json"

// gather keywords from all templates
function loadTemplates(){

  let templateDict = {}
  const normalizedPath = require("path").join(__dirname, "../templates");

  require("fs").readdirSync(normalizedPath).forEach(function(file) {
    if (!validateTemplate(file, requiredTemplateProperties) || file[0] == "_") {
      return
    }
    console.log("found template:", file)
    require("../templates/" + file).keywords.forEach((keyw) => {
      templateDict[keyw.toLowerCase()] = file
    });
    
  });
  return templateDict
}


function getDocTypes(potentialTypeTags){
    return potentialTypeTags.reduce((found, el)=>{
        if (el) el = el.toLowerCase()
        // if key is known and not already in list -> add it
        return el in templateDict && !(found.includes(templateDict[el])) ? found.concat([templateDict[el]]) : found
    }, [])
}

function validateTemplate(filename, requirements){
  const template = require("../templates/" + filename)
  for (const [prop, test] of Object.entries(requirements)) {
    // if prop not existing or if it fails the test
    if(template[prop] == undefined || !(test(template[prop]))){
      console.warn('TEMPLATE NOT VALID! :', filename)
      return false
    }
  }
  return true
}

// maybe use xPath query for XML package instead of hardcoding every path
function parseCredential(xml){
    console.debug(xml)
    const elmo = xml.elmo
    const LOS = elmo.report.learningOpportunitySpecification
    const LOI = LOS.specifies.learningOpportunityInstance
    let cred = require(mockCredentialPath)

    // places to check for keywords
    let potentialTypeTags = [LOS.title?._, LOI?.credit?.level, elmo?.attachment?.title]

    // check if it is a "known document"
    let docTypes = getDocTypes(potentialTypeTags)
    console.log("potential templates:", docTypes, "; using first entry")
    const template = require('../templates/'+docTypes[0])

    // ISSUER
    let issuerData = new template.Issuer(elmo.report.issuer, LOI.level)
    cred.issuer = Object.assign(cred.issuer, issuerData)

    // date 
    cred.diplomaIssuanceDate = elmo.report.issueDate
    cred.diplomaGeneratedDate = elmo.generatedDate

    // CREDENTIAL SUBJECT
    let subjectData = new template.CredentialSubject(elmo.learner)
    subjectData.addDegree(LOS, LOI.credit)
    cred.credentialSubject = Object.assign(cred.credentialSubject, subjectData)

    // ACHIEVEMENTS
    cred.credentialSubject.achieved[0].hasPart.learningAchievements = template.handleAchievements(LOS.hasPart)

    // EXTRAS IF NEEDED
    if (template.hasOwnProperty('handleExtras')) {
        extras = template.handleExtras(elmo)
        Object.assign(cred, extras)
    }

    console.log(cred)
    return cred
}

module.exports = {parseCredential, _testing :{
  templateDict, 
  getDocTypes,
  validateTemplate
}}