import React, { useState, useEffect, useMemo } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "./App.css";
import ChatHistory from "./component/ChatHistory";
import Loading from "./component/Loading";
import io from "socket.io-client";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { HfInference } from "@huggingface/inference";

// Create a socket connection (replace with your server's URL)
const socket = io("http://localhost:4000"); // Example URL for your server

// Initialize Hugging Face Inference
const hf = new HfInference("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"); // Replace with your Hugging Face API key

const App = () => {
  const [userInput, setUserInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en-US");

  const genAI = new GoogleGenerativeAI(
    "AIzaSyAJVMOIAJSuu64Ikdkz-1-V5igUXFEANEM"
  );
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const { transcript, resetTranscript } = useSpeechRecognition();

  // Language options for dropdown
  const languageOptions = [
    { label: "English", value: "en-US" },
    { label: "Hindi", value: "hi-IN" },
    { label: "Marathi", value: "mr-IN" },
  ];

  // Memoized dropdown items
  const dropdownItems = useMemo(
    () =>
      languageOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      )),
    [languageOptions]
  );

  const handleUserInput = (e) => {
    setUserInput(e.target.value);
  };

  // Summarize response using Hugging Face API
  const summarizeText = async (text) => {
    try {
      const summary = await hf.summarization({
        model: "facebook/bart-large-cnn", // You can choose other models for summarization
        inputs: text,
      });
      return summary[0].summary_text;
    } catch (error) {
      console.error("Error summarizing text:", error);
      return text; // Return the original text in case of error
    }
  };

  const sendMessage = async () => {
    if (userInput.trim() === "") return;

    // Combine user input with the short answer request
    const combinedInput = userInput + " give me a short answer with respect to agriculture in India";

    setIsLoading(true);
    try {
      // Use the combined input for the model generation
      const result = await model.generateContent(combinedInput);
      const response = await result.response;
      const responseText = await response.text();

      // Summarize the response
      const summarizedResponse = await summarizeText(responseText);

      setChatHistory([
        ...chatHistory,
        { type: "user", message: userInput },
        { type: "bot", message: summarizedResponse },
      ]);
    } catch {
      console.error("Error sending message");
    } finally {
      setUserInput("");
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setChatHistory([]);
  };

  const handleMicClick = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = selectedLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  const speakMessage = () => {
    const lastMessage = chatHistory[chatHistory.length - 1]?.message || "";

    if (!lastMessage) {
      console.warn("No message to speak.");
      return;
    }

    const utterance = new SpeechSynthesisUtterance(lastMessage);
    utterance.lang = selectedLanguage;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error("Error during speech synthesis:", error);
    }
  };

  useEffect(() => {
    setUserInput(transcript);
  }, [transcript]);

  return (
    <>
      <div className="flex justify-center items-center mb-6 pt-8">
        <img
          className="h-14"
          src="farm.gif"
          style={{ width: "160px", height: "auto" }}
          alt="Krishi-bot Logo"
        />
      </div>

      <div className="container mx-auto px-4 py-4">
        <h1 className="text-3xl font-bold text-center mb-4">Krishi-bot</h1>
        <div className="flex justify-center items-center mt-4 space-x-4">
  {languageOptions.map((option) => (
    <label key={option.value} className="flex items-center space-x-2">
      <input
        type="radio"
        name="language"
        value={option.value}
        checked={selectedLanguage === option.value}
        onChange={(e) => setSelectedLanguage(e.target.value)}
        className="h-4 w-4 text-blue-500 focus:ring-blue-500"
      />
      <span>{option.label}</span>
    </label>
  ))}
</div>

        <div className="chat-container rounded-lg p-4">
          <ChatHistory chatHistory={chatHistory} />
          <Loading isLoading={isLoading} />
        </div>

        <div className="flex mt-4 items-center space-x-2">
          {/* Language Selection */}
          {/* Input Field */}
          <input
            type="text"
            className="flex-grow px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Type your message..."
            value={userInput}
            onChange={handleUserInput}
          />

          <div className="flex ml-2">
            <button
              className="text-2xl bg-blue-400 py-2 px-2 flex justify-center items-center rounded-full font-bebas ml-2"
              onClick={sendMessage}
              disabled={isLoading}
            >
              <img className="w-7" src="send.svg" alt="Send" />
            </button>

            <button
              className="text-2xl bg-purple-400 py-2 px-2 flex justify-center items-center rounded-full font-bebas ml-2"
              onClick={handleMicClick}
            >
              <img className="w-7" src={isListening ? "send.svg" : "mic.svg"} alt="Mic" />
            </button>
          </div>

          <button
            className="text-2xl bg-green-400 py-2 px-2 flex justify-center items-center rounded-full font-bebas ml-2"
            onClick={speakMessage}
          >
            <img className="w-7" src="speaker.svg" alt="Speaker" />
          </button>

          <button
            className="text-2xl bg-red-400 py-2 px-2 flex justify-center items-center rounded-full font-bebas ml-2"
            onClick={clearChat}
          >
            <img className="w-7" src="dustbin.png" alt="Clear Chat" />
          </button>
        </div>
      </div>
    </>
  );
};

export default App;
