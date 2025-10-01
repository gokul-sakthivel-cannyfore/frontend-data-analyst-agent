import { useState } from 'react'
import './App.css'
import { BeatLoader } from "react-spinners";
function App() {
  const [txtContent, setTxtContent] = useState('')
  const [txtResponse, setTxtResponse] = useState()
  const [selectedImages, setSelectedImages] = useState();
  const [responseLoading, setResponseLoading] = useState(false);
  const [fileLoading, setFileLoading] = useState(false)
  const [files, setFiles] = useState([]);


  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTxtFile = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const allowedImageExtensions = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

    if (selectedFiles.length === 0) return;

    setFileLoading(true);
    setFiles((prev) => [...prev, ...selectedFiles]);
    e.target.value = ""; // reset input


    for (const file of selectedFiles) {
      const reader = new FileReader();

      reader.onload = async (event) => {
        let text = event.target.result;

        if (file.type === "text/plain") {
          console.log("Original TXT:", text);
          const urls = text.match(/https?:\/\/\S+/g) || [];

          for (let url of urls) {
            try {
              const formData = new FormData();
              formData.append("url", url);
              const res = await fetch("http://localhost:8000/api/text/", {
                method: "POST",
                body: formData, // multipart/form-data automatically
              });
              // const res = await fetch("http://localhost:8000/api/text/", {
              //   method: "POST",
              //   headers: { "Content-Type": "application/json" },
              //   body: JSON.stringify({ url }),
              // });
              const data = await res.json();
              text = text.replace(url, data.content);
            } catch (err) {
              console.error("Failed to fetch:", url, err);
              text = text.replace(url, `[Could not fetch ${url}]`);
            }
          }
          setTxtContent((prev) => (prev ? prev + "\n" + text : text));
        } else if (file.type === "text/csv") {
          const rows = text.split("\n").map((row) => row.split(","));
          let csvData = rows.map((row) => row.join(" | ")).join("\n");
          console.log(csvData)
          setTxtContent((prev) => (csvData + "\n" + (prev || "")));
        } else if (allowedImageExtensions.includes(file.name.split(".").pop().toLowerCase())) {
          setSelectedImages(file);
        }

        setFileLoading(false);
      };

      reader.readAsText(file);
    }
  };

  const sendToLLM = async () => {
    setResponseLoading(true);
    const formData = new FormData();
    formData.append("text", txtContent);

    if (selectedImages) {
      formData.append("file", selectedImages);
    }

    try {
      const res = await fetch("http://localhost:8000/api/text/", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setTxtResponse(data.response)
      setResponseLoading(false);
      console.log("LLM response:", data.response);
    } catch (err) {
      console.error("Upload failed:", err);
      setResponseLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center  p-6">
      <div className="w-full min-h-screen bg-white shadow-lg rounded-xl p-2">

        <h2 className="text-2xl font-bold text-gray-800 mb-4">Text File Uploader</h2>

        <div className="mb-4">
          <label
            htmlFor="file_input"
            className="flex items-center block mb-2 text-sm font-medium text-gray-700"
          >
            {fileLoading ? (
              <>
                Loading file{" "}
                <BeatLoader
                  color="#2431ebff"
                  loading={fileLoading}
                  size={6}
                />
              </>
            ) : (
              "Choose text files"
            )}
          </label>

          <input
            onChange={handleTxtFile}
            id="file_input"
            type="file"
            multiple
            className="block w-full h-[40px] text-sm text-gray-900 border border-gray-300 rounded-md cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          />

          <div className="mt-3 space-y-2">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-gray-100 px-3 py-2 rounded-md"
              >
                <span className="text-sm text-gray-800">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 font-bold hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={sendToLLM}
          className="flex items-center justify-center text-white bg-blue-700 hover:bg-blue-800 
                     focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg 
                     text-sm px-5 py-2.5 disabled:opacity-50"
        >
          {responseLoading ? (
            <>
              Analyzing <BeatLoader color="#fff" loading={responseLoading} cssOverride={{
                display: "block",
                margin: "0 0 0 6",
                borderColor: "red",
              }} size={6} />
            </>
          ) : (
            "Analyze"
          )}
        </button>

        {txtResponse && (
          <div className="mt-6 p-4 bg-gray-50 border rounded-md">
            <h3 className="text-lg font-semibold mb-2 text-gray-700">API Response:</h3>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-x-auto">
              {txtResponse}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
