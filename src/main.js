document.getElementById('product-version').textContent = import.meta.env.VITE_PRODUCT_VERSION
document.getElementById('build-number').textContent = import.meta.env.VITE_BUILD_NUMBER
document.getElementById('udi-pi').textContent = `(10)${import.meta.env.VITE_PRODUCT_VERSION}`
