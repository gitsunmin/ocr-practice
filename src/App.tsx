import { useState } from "react";
import Tesseract from "tesseract.js";

function App() {
  const [text, setText] = useState('');
  const [process, setProcess] = useState(0);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {

    const file = event.target.files?.[0];

    Tesseract.recognize(
      file, // 이미지 파일이나 URL
      'kor', // 언어 설정
      {
        logger: (m) => {
          setProcess(m.progress); // 인식 진행 상황 로그
        }, // 인식 진행 상황 로그
      }
    ).then((res) => {

      const { data: { text } } = res;
      console.log(text); // 인식된 텍스트
      console.log('res:', res);
      setText(text);
    });
;
    console.log('file:', file);
    
  }
  return (
    <div className='flex py-[30px] px-[20px] gap-[12px] flex-wrap'>  
      <div className="outline-dashed flex justify-center items-center py-[30px] px-[20px] flex-wrap">
        <h1>File Upload</h1>
        <div>
          <input type="file" id="file-upload" name="file-upload" onChange={handleFileUpload} />
        </div>
      </div>
      <div>
        {(process * 100).toFixed(2)}%
      </div>
      <div className="outline-dashed flex justify-center items-center py-[30px] px-[20px] flex-wrap">
        <h1>Text</h1>
        <div>
          {text}
        </div>
      </div>
    </div>
  )
}

export default App
