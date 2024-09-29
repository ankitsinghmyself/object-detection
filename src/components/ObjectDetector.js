import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "../styles/App.css";

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

      ctx.beginPath();
      ctx.rect(x, y, width, height);
      ctx.lineWidth = 2;
      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";
      ctx.stroke();
      ctx.fillText(prediction.class, x, y > 10 ? y - 5 : 10);

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
            }}
          >
            <button onClick={handleStart}>Start Detection</button>
          </div>
        </div>
      ) : (
        <div>
          <h2>Object Detection in Progress</h2>
          <div  style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
            <h3>Detected Objects:</h3>
            <ul>
              {detectedObjects.map((obj, index) => (
                <li key={index}>{obj}</li> // Display all detected object names
              ))}
            </ul>
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
