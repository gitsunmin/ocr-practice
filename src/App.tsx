import { useState } from "react";
import Tesseract, { OEM, PSM } from "tesseract.js";

function App() {
  const [text, setText] = useState("");
  const [process, setProcess] = useState(0);
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const optimizeImageForOCR = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const img = document.createElement("img");
      img.src = URL.createObjectURL(file);

      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          console.error("Canvas context could not be created");
          return;
        }

        // Draw the original image
        ctx.drawImage(img, 0, 0);

        // Convert the image to grayscale
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Grayscale formula
          const gray = 0.3 * r + 0.59 * g + 0.11 * b;
          data[i] = gray; // Red
          data[i + 1] = gray; // Green
          data[i + 2] = gray; // Blue

          // Adjust contrast
          const contrastFactor = 1.5; // 대비 조정을 위한 비율 (1보다 클 경우 색대비를 증가시킴)
          data[i] = Math.min(
            255,
            Math.max(0, (data[i] - 128) * contrastFactor + 128)
          );
          data[i + 1] = Math.min(
            255,
            Math.max(0, (data[i + 1] - 128) * contrastFactor + 128)
          );
          data[i + 2] = Math.min(
            255,
            Math.max(0, (data[i + 2] - 128) * contrastFactor + 128)
          );
        }

        // Put the modified data back
        ctx.putImageData(imageData, 0, 0);

        // Export the canvas to a data URL
        canvas.toDataURL("image/png");
        // resolve(canvas);
        resolve(canvas.toDataURL("image/png"));
        URL.revokeObjectURL(img.src); // Release memory
      };
    });
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setText("");

    const worker = await Tesseract.createWorker("kor", OEM.LSTM_ONLY, {
      logger: (m) => setProcess(m.progress),
    });

    worker.setParameters({
      tessedit_pageseg_mode: PSM.AUTO,
    });

    const file = event.target.files?.[0] ?? null;

    if (file) {
      const preprocessedFile = await optimizeImageForOCR(file);
      setImageUrl(preprocessedFile);
      setBeforeImageUrl(URL.createObjectURL(file));
      const { data } = await worker.recognize(
        preprocessedFile,
        {},
        {
          box: true,
        }
      );

      await worker.terminate();

      const { text } = data;
      setText(text.replace(/[^가-힣\s]/g, ""));
    } else {
      alert("파일을 선택해주세요.");
    }
  };

  return (
    <div className="flex w-screen flex-wrap justify-center mt-[20px]">
      <div className="outline-dashed flex justify-center items-center w-screen flex-wrap mx-[20px] px-[10px] py-[8px]">
        <div>
          <input
            type="file"
            id="file-upload"
            name="file-upload"
            onChange={handleFileUpload}
          />
        </div>
        {beforeImageUrl && imageUrl && (
          <>
            <div className="flex justify-center items-center w-[100%] mt-[20px]">
              <div className="w-[50%]">
                <h1 className="text-center">이미지 전처리 작업 전</h1>
                <img src={beforeImageUrl} alt="image" />
              </div>
              <div className="w-[50%]">
                <h1 className="text-center">이미지 전처리 작업 후</h1>
                <img src={imageUrl} alt="image" />
              </div>
            </div>
          </>
        )}
      </div>
      <div className="w-screen flex justify-center items-center my-[20px]">
        {(process * 100).toFixed(2)}%
      </div>
      <div className="outline-dashed flex justify-center items-center w-screen flex-wrap mx-[20px]">
        <div>{text || "텍스트가 출력 됩니다."}</div>
      </div>
      <canvas id="canvas" style={{ display: "none" }}></canvas>{" "}
    </div>
  );
}

export default App;
