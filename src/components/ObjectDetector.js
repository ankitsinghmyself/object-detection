import React, { useState, useEffect, useRef } from "react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

const ObjectDetector = () => {
  const [model, setModel] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [deviceId, setDeviceId] = useState(null); // State for selected camera device ID
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const spokenObjects = useRef(new Set());
  const [videoDevices, setVideoDevices] = useState([]);

  useEffect(() => {
    const loadModel = async () => {
      await tf.setBackend("webgl");
      const loadedModel = await cocoSsd.load();
      setModel(loadedModel);
    };

    loadModel();
    
    // Get available video devices
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(videoDevices);
      if (videoDevices.length > 0) {
        setDeviceId(videoDevices[0].deviceId); // Select the first camera by default
      }
    });

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { deviceId: deviceId ? { exact: deviceId } : undefined }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.error("Error playing video:", err));
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  const detectObjects = async () => {
    if (model && videoRef.current && videoRef.current.readyState >= 2) {
      const predictions = await model.detect(videoRef.current);
      const filteredPredictions = predictions.filter(prediction => prediction.score >= 0.5);
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
    });

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
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);

        setTimeout(() => {
          spokenObjects.current.delete(text);
        }, 5000);
      }
    }
  };

  const switchCamera = () => {
    const currentIndex = videoDevices.findIndex(device => device.deviceId === deviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setDeviceId(videoDevices[nextIndex].deviceId);
    startVideo(); // Restart video with new device
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
          <button onClick={handleStart}>Start Detection</button>
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
          <button onClick={switchCamera}>Switch Camera</button>
          <a href="/">Back</a>
        </div>
      )}
    </div>
  );
};

export default ObjectDetector;
