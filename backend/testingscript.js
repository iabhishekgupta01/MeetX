
const listModels = async () => {
  const { GoogleGenerativeAI } = require("@google/generative-ai");
  const genAI = new GoogleGenerativeAI("AIzaSyAjPt-JGgPwEu06rUU9jGtTOQI_gPST6pw");
  const result = await genAI.listModels();
  console.log(result);
};
listModels();