// Archivo JS principal

console.log("Proyecto Album cargado correctamente");

// Ejemplo de interacción
document.addEventListener("DOMContentLoaded", function () {
  const cards = document.querySelectorAll(".card");

  cards.forEach((card, index) => {
    card.classList.add("fade-in");

    setTimeout(() => {
      card.classList.add("show");
    }, index * 150);
  });
});
