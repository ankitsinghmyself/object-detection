# Object Detection App

Welcome to the Object Detection App! This application utilizes TensorFlow.js and the COCO-SSD model to detect objects in real time through your webcam. The detected objects are displayed on a canvas overlaying the video feed, and the app can audibly announce the detected objects.

## Features

- Real-time object detection using the COCO-SSD model.
- Webcam access for live video feed.
- Visual display of detected objects with bounding boxes.
- Speech synthesis to announce detected objects.

## Technologies Used

- **React**: A JavaScript library for building user interfaces.
- **TensorFlow.js**: A library for machine learning in JavaScript.
- **COCO-SSD**: A pre-trained model for object detection.

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/object-detection-app.git
   cd object-detection-app
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

### Running the App

1. Start the development server:

   ```bash
   npm start
   ```

   or

   ```bash
   yarn start
   ```

2. Open your web browser and navigate to `http://localhost:3000`.

3. Click the "Start Detection" button to enable webcam access and begin object detection.

## Usage

- Upon clicking the "Start Detection" button, the app will access your webcam and start detecting objects in real-time.
- Detected objects will be displayed with bounding boxes on the canvas.
- The app will announce the detected objects through speech synthesis.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [TensorFlow.js](https://www.tensorflow.org/js) for providing the machine learning library.
- [COCO-SSD](https://github.com/tensorflow/tfjs-models/tree/master/coco-ssd) for the pre-trained object detection model.
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for the speech synthesis functionality.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any bugs or enhancements.
