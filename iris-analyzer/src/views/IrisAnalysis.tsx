import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import IrisSegmenter from '../components/analysis/IrisSegmenter';

const IrisAnalysis: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  
  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setAnalysisResults(null);
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1
  });
  
  const handleSegmentationComplete = (data: any) => {
    setAnalysisResults(data);
  };
  
  return (
    <div className="iris-analysis-container">
      <h1>Análisis y Segmentación de Iris</h1>
      
      <div className="upload-section">
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''}`}
          style={{
            border: '2px dashed #ccc',
            borderRadius: '4px',
            padding: '20px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Suelta la imagen aquí...</p>
          ) : (
            <p>Arrastra una imagen de ojo aquí, o haz clic para seleccionar un archivo</p>
          )}
        </div>
      </div>
      
      {selectedImage && (
        <div className="analysis-section">
          <h2>Imagen Seleccionada</h2>
          
          <div className="analysis-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
            <div className="original-image" style={{ flex: '1 1 45%', minWidth: '300px' }}>
              <h3>Imagen Original</h3>
              <img 
                src={selectedImage} 
                alt="Imagen original" 
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
            
            <div className="segmentation-results" style={{ flex: '1 1 45%', minWidth: '300px' }}>
              <h3>Segmentación</h3>
              <IrisSegmenter 
                imageSrc={selectedImage}
                onSegmentationComplete={handleSegmentationComplete}
              />
            </div>
          </div>
          
          {analysisResults && (
            <div className="measurements-section">
              <h2>Mediciones</h2>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IrisAnalysis;