import React, { useRef, useState, useEffect } from "react";
import { segmentIris } from "../../services/irisSegmentation";
import opencvService from "../../services/opencvService";

interface IrisSegmenterProps {
    imageSrc: string | null;
    onSegmentationComplete?: (data: any) => void;
}

const IrisSegmenter: React.FC<IrisSegmenterProps> = ({ imageSrc, onSegmentationComplete }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [segmentationData, setSegmentationData] = useState<any>(null);
    const [opencvStatus, setOpencvStatus] = useState<string>(opencvService.getStatus());

    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);


    useEffect(() => {
        const checkOpencvStatus = async () => {
        try {
            await opencvService.waitForOpenCV();
            setOpencvStatus('loaded');
        } catch (err) {
            setOpencvStatus('failed');
            setError('Error loading OpenCV.js. Please refresh the page.');
        }
        };

        checkOpencvStatus();
    }, []);

    useEffect(() => {
    if (imageSrc && imageRef.current && canvasRef.current && opencvStatus === 'loaded') {
      const processImage = async () => {
        try {
          setLoading(true);
          setError(null);
          
          if (imageRef.current && !imageRef.current.complete) {
            await new Promise<void>((resolve) => {
              const img = imageRef.current;
              if (img) {
                img.onload = () => resolve();
              } else {
                resolve();
              }
            });
          }
          
          if (imageRef.current && canvasRef.current) {
            const results = await segmentIris(imageRef.current, canvasRef.current);
            setSegmentationData(results);
            
            if (onSegmentationComplete) {
              onSegmentationComplete(results);
            }
          }
        } catch (err) {
          setError(`Error al segmentar el iris: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
          setLoading(false);
        }
      };
      
      processImage();
    }
  }, [imageSrc, opencvStatus, onSegmentationComplete]);

  return (
    <div className="iris-segmenter">
      {opencvStatus !== 'loaded' && (
        <div className="opencv-loading">
          {opencvStatus === 'loading' ? 'Cargando OpenCV.js...' : 'Error al cargar OpenCV.js'}
        </div>
      )}
      
      <div className="image-container" style={{ display: 'none' }}>
        {imageSrc && <img ref={imageRef} src={imageSrc} alt="Imagen de ojo para análisis" />}
      </div>
      
      <div className="canvas-container">
        <canvas 
          ref={canvasRef} 
          className="segmentation-canvas"
          style={{ 
            border: '1px solid #ccc',
            maxWidth: '100%'
          }}
        />
      </div>
      
      {loading && <div className="loading">Procesando imagen...</div>}
      {error && <div className="error">{error}</div>}
      
      {segmentationData && (
        <div className="segmentation-data">
          <h3>Resultados de la Segmentación</h3>
          {segmentationData.irisRadius && (
            <p>Radio del iris: {segmentationData.irisRadius.toFixed(2)}px</p>
          )}
          {segmentationData.pupilRadius && (
            <p>Radio de la pupila: {segmentationData.pupilRadius.toFixed(2)}px</p>
          )}
          {segmentationData.irisRadius && segmentationData.pupilRadius && (
            <p>Ratio pupila/iris: {(segmentationData.pupilRadius / segmentationData.irisRadius).toFixed(3)}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default IrisSegmenter;