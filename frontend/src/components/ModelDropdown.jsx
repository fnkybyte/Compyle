import React, { useState, useEffect, useRef } from "react";

const models = [
  { id: "amazon/nova-2-lite-v1:free", label: "Nova 2 Lite", logo: "https://img.icons8.com/color/144/amazon.png" },
  { id: "google/gemma-3-27b-it:free", label: "Gemma 3.0", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { id: "openai/gpt-oss-20b:free", label: "ChatGPT 4.0", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4d/OpenAI_Logo.svg" },
  { id: "z-ai/glm-4.5-air:free", label: "GLM 4.5 Air", logo: "https://img.icons8.com/external-black-fill-lafs/64/external-Golem-cryptocurrency-black-fill-lafs-2.png" },
  { id: "tngtech/deepseek-r1t2-chimera:free", label: "DeepSeek R1T2 Chimera", logo: "https://img.icons8.com/color/96/deepseek.png" },
  { id: "meta-llama/llama-guard-4-12b:free", label: "Llama Guard 4", logo: "https://img.icons8.com/fluency/96/meta.png" },
  { id: "google/gemini-2.0-flash-exp:free", label: "Gemini 2.0 Flash", logo: "https://img.icons8.com/fluency/96/bard.png" }
];

export default function ModelDropdown({ selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const current = models.find((m) => m.id === selected);

  // ============================
  // Close when clicking outside
  // ============================
  useEffect(() => {
    const handleOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  return (
    <div className="model-dropdown" ref={dropdownRef}>
      {/* Selected Display */}
      {/* <div className="model-dropdown-selected" onClick={() => setOpen(!open)}>
        {current && (
          <>
            <img src={current.logo} className="model-logo" alt="" />
            <span>{current.label}</span>
          </>
        )}
      </div> */}

      <div className="model-dropdown-selected" onClick={() => setOpen(!open)}>
        {current && (
          <>
            <img src={current.logo} className="model-logo" alt="" />
            <span>{current.label}</span>

            {/* ▼ arrow icon */}
            <span className={`dropdown-arrow ${open ? "open" : ""}`}>
              ▼
            </span>
          </>
        )}
      </div>

      {/* Dropdown Menu */}
      {open && (
        <div className="model-dropdown-menu">
          {models.map((m) => (
            <div
              key={m.id}
              className="model-dropdown-item"
              onClick={() => {
                onSelect({ value: m.id, label: m.label });
                setOpen(false);
              }}
            >
              <img src={m.logo} className="model-logo" alt="" />
              <span>{m.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
