
var ourProductsSwiper = new Swiper(".our-projects-swiper", {
  slidesPerView: 1.05,
  speed: 500,
  centeredSlides: true,
  spaceBetween: 14,
  grabCursor: true,
  navigation: {
    nextEl: '.our-projects-next__btn',
    prevEl: '.our-projects-prev__btn',
  },
  breakpoints: {

    640: {
      slidesPerView: "auto",
      spaceBetween: 20,
      centeredSlides: false,
    }

  },
});