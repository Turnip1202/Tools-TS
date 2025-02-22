import { generateProjectJSONDataConsole,generateProjectJSONDatawriteFile } from "./src"

export {generateProjectJSONDataConsole,generateProjectJSONDatawriteFile} 


// generateProjectJSONDataConsole("D:\\ACode\\Code_test")
// .then(console.log)
//   .catch(console.error)

generateProjectJSONDatawriteFile("D:\\ACode\\Code_test")
.then(console.log)
.catch(console.error)