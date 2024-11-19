import React from 'react';

const ButtonPanel = React.memo(({ colorButtons, onColorSelected, selectedColor, onTagSelected }) => (
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
          <div style={{ marginTop: '5px', display: 'flex', overflowX: 'auto' }}>
            {predefinedImages.map((image) => (
              <div key={image.id} style={{ marginRight: '10px' }}>
                <img
                  src={image.src}
                  alt={image.alt}
                  style={{
                    width: '50px',
                    height: '50px',
                    cursor: 'pointer',
                    border: '1px solid #ddd',
                    borderRadius: '5px'
                  }}
                  onClick={() => onTagSelected(colorHex, image.tag)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    ))}
  </div>
));

export default ButtonPanel;
