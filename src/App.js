import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import ThreeScene from './ThreeScene';

// Define your predefined images
const predefinedImages = [
  { id: 'img1', src: '/images/EXPOSED_CUT_COPPER.png', tag: 'EXPOSED_CUT_COPPER' },
  { id: 'img2', src: '/images/OBSIDIAN.png', tag: 'OBSIDIAN' },
  { id: 'img3', src: '/images/REDSTONE_BLOCK.png', tag: 'REDSTONE_BLOCK' },
  { id: 'img4', src: '/images/BONE_BLOCK.png', tag: 'BONE_BLOCK' }
];

const saveToLocalStorage = (colorImages, colorTags) => {
  localStorage.setItem('colorImages', JSON.stringify(colorImages));
  localStorage.setItem('colorTags', JSON.stringify(colorTags));
};

const loadFromLocalStorage = () => {
  const storedColorImages = localStorage.getItem('colorImages');
  const storedColorTags = localStorage.getItem('colorTags');

  return {
    colorImages: storedColorImages ? JSON.parse(storedColorImages) : {},
    colorTags: storedColorTags ? JSON.parse(storedColorTags) : {}
  };
};

const ButtonPanel = React.memo(({ colorButtons, onColorSelected, selectedColor, onImageSelected }) => (
  <div className="button-panel">
    {colorButtons.map((colorHex, index) => (
      <div key={index} style={{ marginBottom: '10px' }}>
        <button
          style={{
            backgroundColor: colorHex,
            border: 'none',
            borderRadius: '5px',
            color: 'white',
            margin: '2px',
            padding: '10px',
            cursor: 'pointer'
          }}
          onClick={() => onColorSelected(colorHex)}
        >
          {colorHex}
        </button>
        {selectedColor === colorHex && (
          <div style={{ marginTop: '5px' }}>
            {predefinedImages.map((image) => (
              <img
                key={image.id}
                src={image.src}
                alt={image.tag}
                style={{
                  width: '50px',
                  height: '50px',
                  cursor: 'pointer',
                  margin: '2px'
                }}
                onClick={() => onImageSelected(colorHex, image.src, image.tag)}
              />
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
));

function App() {
  const [selectedColor, setSelectedColor] = useState('');
  const [colorButtons, setColorButtons] = useState([]);
  const [colorImages, setColorImages] = useState({});
  const [colorTags, setColorTags] = useState({});

  useEffect(() => {
    const { colorImages, colorTags } = loadFromLocalStorage();
    setColorImages(colorImages);
    setColorTags(colorTags);
  }, []);

  const handleColorSelected = useCallback((colorHex) => {
    setSelectedColor(colorHex);
  }, []);

  const handleColorsUpdated = useCallback((colors) => {
    setColorButtons(colors);
  }, []);

  const handleImageSelected = useCallback((colorHex, imageSrc, imageTag) => {
    const updatedColorImages = {
      ...colorImages,
      [colorHex]: imageSrc
    };

    const updatedColorTags = {
      ...colorTags,
      [colorHex]: { tag: imageTag, imageSrc }
    };

    setColorImages(updatedColorImages);
    setColorTags(updatedColorTags);
    
    saveToLocalStorage(updatedColorImages, updatedColorTags);
  }, [colorImages, colorTags]);

  return (
    <div className="App">
      <div className="container">
        <div className="three-container">
          <ThreeScene 
            onColorSelected={handleColorSelected} 
            onColorsUpdated={handleColorsUpdated} 
            colorImages={colorImages} 
            colorTags={colorTags}
          />
        </div>
        <ButtonPanel 
          colorButtons={colorButtons} 
          onColorSelected={handleColorSelected} 
          selectedColor={selectedColor}
          onImageSelected={handleImageSelected}
        />
        {/* Display Selected Color Info */}
        {selectedColor && colorTags[selectedColor] && (
          <div className="selected-color-info">
            <h3>Selected Color: {selectedColor}</h3>
            <p>Tag: {colorTags[selectedColor].tag}</p>
            <img 
              src={colorTags[selectedColor].imageSrc} 
              alt={colorTags[selectedColor].tag} 
              style={{ width: '100px', height: '100px', marginTop: '10px' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
