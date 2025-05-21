import * as tf from '@tensorflow/tfjs';

export const loadModel = async (): Promise<tf.LayersModel> => {
    try {
        const model = await tf.loadLayersModel('file://model/model.json');
        console.log('Model loaded successfully');
        return model;
    }
    catch (error) {
        console.error('Error loading model:', error);
        throw error;
    }
};

export const preprocessImage = (image: HTMLImageElement): tf.Tensor => {
    const tensor = tf.browser.fromPixels(image);
    const resized = tf.image.resizeBilinear(tensor, [224, 224]);
    const normalized = resized.div(255.0);
    return normalized.expandDims(0);
};

export interface IrisData {
  pupilCenterX: number;
  pupilCenterY: number;
  pupilRadius: number;
  irisCenterX: number;
  irisCenterY: number;
  irisRadius: number;
}

export const segmentIris = async (
  imageElement: HTMLImageElement,
  canvas: HTMLCanvasElement
): Promise<{
  irisCenter: { x: number, y: number } | null,
  irisRadius: number | null,
  pupilCenter: { x: number, y: number } | null,
  pupilRadius: number | null
}> => {
    try {
    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) throw new Error('No se pudo obtener el contexto del canvas');

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    canvasContext.drawImage(imageElement, 0, 0);


    const dataUrl = canvas.toDataURL('image/png');
    
    const irisData = await window.electronAPI.processIrisImage(dataUrl) as IrisData;
    
    canvasContext.strokeStyle = 'red';
    canvasContext.lineWidth = 2;
    canvasContext.beginPath();
    canvasContext.arc(irisData.irisCenterX, irisData.irisCenterY, irisData.irisRadius, 0, 2 * Math.PI);
    canvasContext.stroke();
    
    canvasContext.strokeStyle = 'blue';
    canvasContext.lineWidth = 2;
    canvasContext.beginPath();
    canvasContext.arc(irisData.pupilCenterX, irisData.pupilCenterY, irisData.pupilRadius, 0, 2 * Math.PI);
    canvasContext.stroke();
    
    return {
      irisCenter: { x: irisData.irisCenterX, y: irisData.irisCenterY },
      irisRadius: irisData.irisRadius,
      pupilCenter: { x: irisData.pupilCenterX, y: irisData.pupilCenterY },
      pupilRadius: irisData.pupilRadius
    };
  } catch (error) {
    console.error('Error during iris segmentation:', error);
    throw error;
  }
    
};