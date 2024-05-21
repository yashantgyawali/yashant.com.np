function flipCard(card) {
    card.classList.add("flipped");
    card.onclick = null; // Remove the click event listener after the first click
}