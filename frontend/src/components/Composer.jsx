import React, { useState } from 'react';

const Composer = ({ onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [model, setModel] = useState('openai/gpt-4-turbo');
  const [temperature, setTemperature] = useState(0.7);
  const [maxLength, setMaxLength] = useState(2048);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage({ message, model, options: { temperature, maxLength } });
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
      <div className="advanced-options">
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
            onChange={(e) => setMaxLength(parseInt(e.target.value))}
          />
        </div>
      </div>
      <div className="composer-controls">
        <div>
          {/* TODO: Populate model selector from API */}
          <select className="model-selector" value={model} onChange={(e) => setModel(e.target.value)}>
            <option value="openai/gpt-4-turbo">OpenAI / gpt-4-turbo</option>
            <option value="anthropic/claude-3-opus-20240229">Anthropic / claude-3-opus</option>
          </select>
        </div>
        <div>
          <button className="icon-btn">📎</button>
          <button className="icon-btn">🎤</button>
          <button className="send-btn" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default Composer;
