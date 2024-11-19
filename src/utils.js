export const getImageByColor = (colorHex, colorImages) => {
  // Vérifie si une couleur a une image associée dans l'objet colorImages
  if (colorImages && colorImages[colorHex]) {
    return colorImages[colorHex]["imageSrc"]; // Retourne l'URL de l'image associée à la couleur
  }
  return null; // Retourne null si aucune image n'est trouvée pour la couleur
};

  
export const getTagByColor = (colorHex, colorTags) => {
  // Vérifie si une couleur a un tag et une image associés dans l'objet colorTags
  if (colorTags && colorTags[colorHex]) {
    return colorTags[colorHex]["tag"]; // Retourne l'objet contenant le tag et l'image associés à la couleur
  }
  return "STONE"; // Retourne null si aucune association n'est trouvée
};
  