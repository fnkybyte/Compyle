import React, { useState } from 'react';

const Composer = ({ onSendMessage }) => {
  // store model as an object { value, label }
  const [message, setMessage] = useState('');
  const [model, setModel] = useState({
    value: 'x-ai/grok-4.1-fast:free',
    label: 'Grok 4.1 fast'
  });
  const [temperature, setTemperature] = useState(0.7);
  const [maxLength, setMaxLength] = useState(2048);

  const handleSend = () => {
    if (message.trim()) {
      // send both the raw model id (value) and the human label
      onSendMessage({
        message,
        model: model.value,
        modelLabel: model.label,
        options: { temperature, maxLength }
      });
      setMessage('');
    }
  };

  return (
    <div className="composer-container">
      <textarea
        className="composer-textarea"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
      />

      {/* <div className="advanced-options">
        <div className="slider-group">
          <label>Temperature: {temperature}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
        </div>

        <div className="slider-group">
          <label>Max Length: {maxLength}</label>
          <input
            type="range"
            min="256"
            max="4096"
            step="256"
            value={maxLength}
            onChange={(e) => setMaxLength(parseInt(e.target.value, 10))}
          />
        </div>
      </div> */}

      <div className="composer-controls">
        <div>
          <select
            className="model-selector"
            value={model.value}
            onChange={(e) => {
              const selectedIndex = e.target.selectedIndex;
              const label = e.target.options[selectedIndex].textContent;
              setModel({ value: e.target.value, label });
            }}
          >
            <option value="x-ai/grok-4.1-fast:free">Grok 4.1 fast</option>
            <option value="google/gemini-2.0-flash-exp:free">Gemini 2.0 Flash</option>
            <option value="openai/gpt-oss-20b:free">ChatGPT 4.0</option>
            <option value="z-ai/glm-4.5-air:free">GLM 4.5 Air</option>
            <option value="tngtech/deepseek-r1t2-chimera:free">DeepSeek R1T2 Chimera</option>
          </select>
        </div>

        <div>
          <button className="send-btn" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
