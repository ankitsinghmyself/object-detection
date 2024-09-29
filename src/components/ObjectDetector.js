import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "../styles/App.css";
const ObjectDetector = () => {
  const [model, setModel] = useState(null);
  const [isStarted, setIsStarted] = useState(false); // State to track if the app has started
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const spokenObjects = useRef(new Set());

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl");
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };

    // Load the model on initial render
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

    const videoWidth = videoRef.current.videoWidth || 640; // Fallback if not loaded
    const videoHeight = videoRef.current.videoHeight || 480; // Fallback if not loaded

    // Set the canvas size to match video size
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    // Create a new set to track spoken objects for this detection cycle
    const currentSpokenObjects = new Set();

    predictions.forEach((prediction) => {
      const [x, y, width, height] = prediction.bbox;

      // Draw the bounding box
      ctx.beginPath();
      ctx.rect(x, y, width, height); // Use original coordinates as canvas matches video
      ctx.lineWidth = 2;
      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";
      ctx.stroke();
      ctx.fillText(prediction.class, x, y > 10 ? y - 5 : 10);

      // Add the predicted class to current spoken objects
      currentSpokenObjects.add(prediction.class);
    });

    // Speak objects that haven't been spoken in this cycle
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
      spokenObjects.current.add(text); // Mark this object as spoken

      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US"; // Set language

        // Check if speech synthesis is supported
        if (!window.speechSynthesis.speaking) {
          window.speechSynthesis.speak(utterance);
        }

        // Optionally, reset spoken objects after a certain duration
        setTimeout(() => {
          spokenObjects.current.delete(text);
        }, 5000); // Wait for 5 seconds before allowing it to be spoken again
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
            }}
          >
            <button onClick={handleStart}>Start Detection</button>
          </div>
        </div>
      ) : (
        <div>
          <h2>Object Detection in Progress</h2>
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
        </div>
      )}
    </div>
  );
};

export default ObjectDetector;
