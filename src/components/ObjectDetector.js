import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const ObjectDetector = () => {
  const [model, setModel] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const spokenObjects = useRef(new Set());
  const [detectedObjects, setDetectedObjects] = useState([]); // State to store detected object names

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl");
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };

    loadModel();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startVideo = async (facingMode = "user") => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facingMode },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current
          .play()
          .catch((err) => console.error("Error playing video:", err));
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const detectObjects = async () => {
    if (model && videoRef.current && videoRef.current.readyState >= 2) {
      const predictions = await model.detect(videoRef.current);
      const filteredPredictions = predictions.filter(
        (prediction) => prediction.score >= 0.5
      );

      drawPredictions(filteredPredictions);
    }
    requestAnimationFrame(detectObjects);
  };

  const drawPredictions = (predictions) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  
    const videoWidth = videoRef.current.videoWidth || 640;
    const videoHeight = videoRef.current.videoHeight || 480;
  
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;
  
    const currentSpokenObjects = new Set();
    const objectNames = []; // Array to store detected object names
  
    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;
    
      // Rounded rectangles with shadow for a sleek look
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 10); // Using roundRect for rounded corners
      ctx.lineWidth = 3;
      ctx.strokeStyle = "#00ddff"; // Slightly transparent blue
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)"; // Add shadow for AI feel
      ctx.shadowBlur = 10;
      ctx.stroke();
      
      // Add extra bold corners
      const cornerRadius = 10;
      const cornerLineWidth = 6; // Thicker lines for corners
      ctx.lineWidth = cornerLineWidth;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + cornerRadius);
      ctx.lineTo(x, y);
      ctx.lineTo(x + cornerRadius, y);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerRadius, y);
      ctx.lineTo(x + width, y);
      ctx.lineTo(x + width, y + cornerRadius);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(x, y + height - cornerRadius);
      ctx.lineTo(x, y + height);
      ctx.lineTo(x + cornerRadius, y + height);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(x + width - cornerRadius, y + height);
      ctx.lineTo(x + width, y + height);
      ctx.lineTo(x + width, y + height - cornerRadius);
      ctx.stroke();
    
      // Text for object name
      ctx.font = "16px 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // White text with transparency
      ctx.textBaseline = "top";
      ctx.fillText(prediction.class, x + 5, y > 10 ? y - 20 : 10); // Slightly above the box
    
      // Text background for better readability
      const textWidth = ctx.measureText(prediction.class).width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; // Semi-transparent black background
      ctx.fillRect(x, y > 10 ? y - 20 : 10, textWidth + 10, 20); // Draw behind text
      ctx.fillStyle = "rgba(255, 255, 255, 0.9)"; // White text on top of background
      ctx.fillText(prediction.class, x + 5, y > 10 ? y - 20 : 10);
    
      currentSpokenObjects.add(prediction.class);
      objectNames.push(prediction.class); // Add detected object name to the array
    });
    
  
    setDetectedObjects(objectNames); // Update state with all detected object names
  
    currentSpokenObjects.forEach((obj) => speak(obj));
  };
  

  const handleStart = () => {
    setIsStarted(true);
    startVideo();
    detectObjects();
  };

  const speak = (text) => {
    text = `There is a ${text}`;
    if (!spokenObjects.current.has(text)) {
      spokenObjects.current.add(text);

      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";

        if (!window.speechSynthesis.speaking) {
          window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => {
          spokenObjects.current.delete(text);
        }, 5000);
      }
    }
  };

  const switchCamera = () => {
    const currentFacingMode = videoRef.current.srcObject
      ?.getVideoTracks()[0]
      ?.getSettings()?.facingMode;
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
    startVideo(newFacingMode);
  };

  return (
    <div>
      {!isStarted ? (
        <div>
          <h2>Welcome to Object Detection App</h2>
          <p>
            Click the button below to start the application and enable webcam
            access.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
            }}
          >
            <button onClick={handleStart}>Start Detection</button>

            <div className="responsive-image-container">
              <img
                src="/img/imgAi.webp"
                alt="Home Image AI"
                className="responsive-image"
              />
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <h3>Detected Objects:</h3>
            <ul>
              {detectedObjects.map((obj, index) => (
                <li key={index}>{obj}</li>
              ))}
            </ul>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button onClick={switchCamera}>Switch Camera</button>
            <a href="/">Back</a>
          </div>
          <div className="video-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              width="640"
              height="480"
            ></video>
            <canvas ref={canvasRef} width="640" height="480"></canvas>
          </div>
        </div>
      )}
    </div>
  );
};

export default ObjectDetector;
