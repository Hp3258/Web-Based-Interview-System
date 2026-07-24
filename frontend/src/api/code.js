import axiosInstance from "../lib/axios";

export const codeApi = {
  runCode: async ({ code, language, problemId, runType }) => {
    const response = await axiosInstance.post("/code/run", {
      code,
      language,
      problemId,
      runType,
    });
    return response.data;
  }
};
