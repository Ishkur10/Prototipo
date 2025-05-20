import * as tf from '@tensorflow/tfjs';
import opencvService from './opencvService';

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

export const segmentIris = async (
  imageElement: HTMLImageElement,
  canvas: HTMLCanvasElement
): Promise<{
  irisCenter: { x: number, y: number } | null,
  irisRadius: number | null,
  pupilCenter: { x: number, y: number } | null,
  pupilRadius: number | null
}> => {

    await opencvService.waitForOpenCV();
    const cv = window.cv;

    const canvasContext = canvas.getContext('2d');
    if (!canvasContext) throw new Error('No se pudo obtener el contexto del canvas');

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;
    canvasContext.drawImage(imageElement,0,0);

    try {
        const src = cv.imread(imageElement);

        const gray = new cv.Mat(); 
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        const blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5,5),0);

        const binary = new cv.Mat();
        cv.adaptiveThreshold(blurred,binary, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INVI, 11, 2);


        const kernel = cv.Mat.ones(5,5, cv.CV_8U);
        const morphed = new cv.Mat();
        const anchor = new cv.Point(-1, -1);
        cv.morphologyEx(binary, morphed, cv.MORPH_OPEN, kernel, anchor, 1);

        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(morphed, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

        type CircleData = { center: { x: number, y: number }, radius: number };

        let irisData: CircleData | null = null;
        let pupilData: CircleData | null = null;

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            const perimeter = cv.arcLength(contour,true);

            const circularity = 4 * Math.PI * area/ (perimeter * perimeter);

            if (circularity > 0.7) {
                const circle = cv.minEnclosingCircle(contour);
                const center = { x: circle.center.x, y: circle.center.y };
                const radius = circle.radius;

                if (radius > 10 && radius < canvas.height / 4) {
                    if (!pupilData || radius < pupilData.radius) {
                        pupilData = { center, radius };
                    } else if (!irisData || (radius > pupilData.radius && radius < canvas.height / 2)) {
                        irisData = { center, radius };
                    }
                }
            }
            contour.delete();
        }

        if (!irisData?.center || !irisData.radius) {

            const circles = new cv.Mat();
            cv.HoughCirlces(
                blurred,
                circles,
                cv.HOUGH_GRADIENT,
                1,
                blurred.rows / 8,
                100,
                30,
                Math.round(blurred.rows / 8),
                Math.round(blurred.rows / 2)
            );

            if(circles.cols > 0){
                let smallesCircle = { center: { x: 0, y: 0 }, radius: Infinity};
                let largestCircle ={ center: { x: 0, y: 0 }, radius: 0 };

                for (let i = 0; i < circles.cols; i++){
                    const x = circles.data32F[i*3];
                    const y = circles.data32F[i*3 + 1];
                    const radius = circles.data32F[i*3 + 2];
                    
                    if(radius < smallesCircle.radius){
                        smallesCircle = {
                            center: { x, y },
                            radius
                        };
                    }

                    if (radius > largestCircle.radius && radius < blurred.rows / 2){
                        largestCircle = {
                            center: { x, y },
                            radius
                        };
                    }

                }
                
                if (smallesCircle.center){
                    pupilData = smallesCircle;
                }

                if (largestCircle.center){
                    irisData = largestCircle;
                }
            }
            
            circles.delete();
        }

        if (irisData && irisData.center && irisData.radius){
            canvasContext.strokeStyle = 'red';
            canvasContext.lineWidth = 2;
            canvasContext.beginPath();
            canvasContext.arc(irisData.center.x, irisData.center.y, irisData.radius, 0,2 * Math.PI);
            canvasContext.stroke();
        }

         if (pupilData && pupilData.center && pupilData.radius) {
            canvasContext.strokeStyle = 'blue';
            canvasContext.lineWidth = 2;
            canvasContext.beginPath();
            canvasContext.arc(pupilData.center.x, pupilData.center.y, pupilData.radius, 0, 2 * Math.PI);
            canvasContext.stroke();
        }

        src.delete();
        gray.delete();
        blurred.delete();
        binary.delete();
        kernel.delete();
        morphed.delete();
        contours.delete();
        hierarchy.delete();
        return {
            irisCenter: irisData ? irisData.center : { x: 0, y: 0 },
            irisRadius: irisData ? irisData.radius : 0,
            pupilCenter: pupilData ? pupilData.center : { x: 0, y: 0 },
            pupilRadius: pupilData ? pupilData.radius : 0
            };
        } catch (error) {
            console.error('Error during iris segmentation:', error);
            throw error;
            }
  
};