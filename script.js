// Verificar si sessionStorage está disponible
function isSessionStorageAvailable() {
    try {
        const test = '__sessionStorage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch(e) {
        console.error('sessionStorage no está disponible:', e);
        return false;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const mealPlanner = document.getElementById('mealPlanner');
    const mealModal = document.getElementById('mealModal');
    const modalTitle = document.getElementById('modalTitle');
    const mealForm = document.getElementById('mealForm');
    const selectedDay = document.getElementById('selectedDay');
    const selectedMeal = document.getElementById('selectedMeal');
    const closeBtn = document.querySelector('.close');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const randomBtn = document.getElementById('randomBtn');
    
    // Verificar sessionStorage
    if (!isSessionStorageAvailable()) {
        alert('Advertencia: Tu navegador no soporta sessionStorage. Los datos no se guardarán.');
    }
    
    // Cargar datos guardados
    loadMeals();
    
    // Event listeners
    const dayCells = document.querySelectorAll('.day-cell');
    dayCells.forEach(cell => {
        cell.addEventListener('click', function() {
            const day = this.getAttribute('data-day');
            const meal = this.getAttribute('data-meal');
            
            selectedDay.value = day;
            selectedMeal.value = meal;
            modalTitle.textContent = `Planificar ${meal} del ${day}`;
            
            // Mostrar modal
            mealModal.style.display = 'block';
        });
    });
    
    closeBtn.addEventListener('click', function() {
        mealModal.style.display = 'none';
    });
    
    window.addEventListener('click', function(event) {
        if (event.target === mealModal) {
            mealModal.style.display = 'none';
        }
    });
    
    // Event listener único para el formulario
    mealForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const day = selectedDay.value;
        const meal = selectedMeal.value;
        let mealData;
        
        // Procesamiento normal del formulario
        mealData = {
            protein: document.getElementById('protein').value,
            carb: document.getElementById('carb').value,
            vegetable: document.getElementById('vegetable').value,
            fat: document.getElementById('fat').value,
            condiment: document.getElementById('condiment').value,
            extra: document.getElementById('extra').value
        };
        
        saveMeal(day, meal, mealData);
        renderMeal(day, meal, mealData);
        mealForm.reset();
        mealModal.style.display = 'none';
    });
    
    // Event listener para el botón aleatorio
    randomBtn.addEventListener('click', function() {
        const mealData = generarPlatoAleatorio();
        // Llenamos el formulario con los valores aleatorios
        document.getElementById('protein').value = mealData.protein;
        document.getElementById('carb').value = mealData.carb;
        document.getElementById('vegetable').value = mealData.vegetable;
        document.getElementById('fat').value = mealData.fat;
        document.getElementById('condiment').value = mealData.condiment;
        document.getElementById('extra').value = mealData.extra;
    });
    
    exportBtn.addEventListener('click', exportToPDF);
    
    clearBtn.addEventListener('click', function() {
        if (confirm('¿Estás seguro de que quieres limpiar todo el planificador?')) {
            sessionStorage.removeItem('mealPlannerData');
            dayCells.forEach(cell => {
                cell.innerHTML = '';
            });
        }
    });
    
    // Funciones auxiliares
   // Reemplaza las funciones saveMeal y loadMeals con esta versión mejorada
const storage = {
    set: (key, value) => {
        try {
            // Primero intenta con sessionStorage
            sessionStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('sessionStorage falló, intentando con localStorage');
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e2) {
                console.error('Ambos storage fallaron', e2);
                return false;
            }
        }
    },
    get: (key) => sessionStorage.getItem(key) || localStorage.getItem(key),
    remove: (key) => {
        sessionStorage.removeItem(key);
        localStorage.removeItem(key);
    }
};

function saveMeal(day, meal, mealData) {
    try {
        let plannerData = JSON.parse(storage.get('mealPlannerData')) || {};
        
        if (!plannerData[day]) {
            plannerData[day] = {};
        }
        
        plannerData[day][meal] = mealData;
        
        if (!storage.set('mealPlannerData', JSON.stringify(plannerData))) {
            alert('No se pudo guardar. Los datos no persistirán al recargar.');
            // Guardar en memoria como último recurso
            window.tempMealStorage = plannerData;
        }
        
        return true;
    } catch (error) {
        console.error('Error al guardar:', error);
        alert('No se pudo guardar el plato. Detalles en consola (F12).');
        return false;
    }
}

function loadMeals() {
    try {
        // Primero verifica si hay datos en memoria temporal
        if (window.tempMealStorage) {
            console.log('Cargando datos de memoria temporal');
            for (const day in window.tempMealStorage) {
                for (const meal in window.tempMealStorage[day]) {
                    renderMeal(day, meal, window.tempMealStorage[day][meal]);
                }
            }
            return true;
        }
        
        // Intenta cargar de sessionStorage/localStorage
        const plannerData = JSON.parse(storage.get('mealPlannerData'));
        
        if (plannerData) {
            console.log('Datos cargados:', plannerData);
            for (const day in plannerData) {
                for (const meal in plannerData[day]) {
                    renderMeal(day, meal, plannerData[day][meal]);
                }
            }
            return true;
        }
        console.log('No hay datos guardados aún');
        return false;
    } catch (error) {
        console.error('Error al cargar:', error);
        return false;
    }
}
    
    function renderMeal(day, meal, mealData) {
    const cell = document.querySelector(`.day-cell[data-day="${day}"][data-meal="${meal}"]`);
    
    if (!cell) {
        console.error('No se encontró la celda para:', day, meal);
        return;
    }
    
    // Limpiar celda
    cell.innerHTML = '';
    
    // Verificar si mealData es válido
    if (!mealData || typeof mealData !== 'object') {
        console.error('Datos de comida inválidos:', mealData);
        return;
    }
    
    // Array de componentes a mostrar
    const components = [
        { key: 'protein', emoji: '🍗' },
        { key: 'carb', emoji: '🍚' },
        { key: 'vegetable', emoji: '🥦' },
        { key: 'fat', emoji: '🥑' },
        { key: 'condiment', emoji: '🌿' },
        { key: 'extra', emoji: '➕' }
    ];
    
    components.forEach(comp => {
        if (mealData[comp.key]) {
            const el = document.createElement('div');
            el.className = 'meal-item';
            el.textContent = `${comp.emoji} ${mealData[comp.key]}`;
            cell.appendChild(el);
        }
    });
    
    console.log('Comida renderizada en:', day, meal);
}

    function generarPlatoAleatorio() {
        // Definimos los ingredientes por categoría
        const ingredientes = {
            proteinas: [
                "CARNE ROJA", "POLLO", "CERDO", "PESCADO", "HUEVO", 
                "LENTEJAS", "POROTOS", "GARBANZOS", "TOFU"
            ],
            carbohidratos: [
                "ARROZ INTEGRAL", "QUINOA", "COUS COUS", "GARBANZOS", "LENTEJAS",
                "VARIEDAD DE POROTOS", "MANDIOCA", "TAPIOCA", "AVENA",
                "HARINAS INTEGRALES", "FIDEOS INTEGRALES"
            ],
            vegetales: [
                "PAPA", "BONIATO", "ZANAHORIA", "REMOLACHA", "ZAPALLO O CALABACHI",
                "ZAPALLITO O ZUCCHINI", "ACELGA/ESPINACA", "BIÓCCULICOLIFLOR",
                "BERENJENA", "TOMATE", "CEBOLLA"
            ],
            grasas: [
                "PALTA", "ACEITE DE OLIVA EXTRA VIRGEN", "ACEITE DE COCO",
                "ACEITUNAS", "FRUTOS SECOS", "SEMILLAS", "OTROS ACEITES"
            ],
            condimentos: [
                "AJO/YEEBOLLA/MORRON", "CÚRCUMA/PIMIENTA", "CUBRIVICOMINOLAJUREL",
                "PIMENTÓN/PIMIENTA", "SAL MARINA/SAL ROSADA", "ORÉGANO/TOMILLO",
                "ROMERO/ENELDO", "JENGIBRE EN POLVO O NATURAL", "CEBOLLA EN ESCANAS",
                "CILANTRO/PEREJIL", "MENTA/ALBAHACA", "CANELAVANS (DULCES)"
            ],
            extras: [
                "MAYONESA CASERA", "MIEL", "HUMMUS", "TERVARI", "MOSTAZA DIJON",
                "FRUTAS PASAS", "FRUTAS NATURALES", "SALSA DE YOGUR CON HIERBAS",
                "VINAGRE DE MANZANA", "CHIMICHUBRI CASERO", "SALSA DE TOMATE", "GUACAMOLE"
            ]
        };

        const seleccionAleatoria = (array) => array[Math.floor(Math.random() * array.length)];

        return {
            protein: seleccionAleatoria(ingredientes.proteinas),
            carb: seleccionAleatoria(ingredientes.carbohidratos),
            vegetable: seleccionAleatoria(ingredientes.vegetales),
            fat: seleccionAleatoria(ingredientes.grasas),
            condiment: seleccionAleatoria(ingredientes.condimentos),
            extra: Math.random() > 0.5 ? seleccionAleatoria(ingredientes.extras) : ""
        };
    }
});

function exportToPDF() {
    // Verificar que las dependencias están cargadas
    if (!window.jspdf || !window.html2canvas) {
        alert('Error: Las librerías para generar PDF no están disponibles. Intenta recargar la página.');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm'
    });

    doc.setFontSize(20);
    doc.setTextColor(40);
    doc.text('Planificador Semanal de Comidas Saludables', 105, 15, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text('"Cuidar el bolsillo también es cuidar el cuerpo, la mente y el espíritu."', 105, 22, { align: 'center' });

    html2canvas(document.getElementById('mealPlanner'), {
        scale: 2,
        logging: false,
        useCORS: true
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 280;
        const pageHeight = 190;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        
        doc.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
        
        const date = new Date();
        const formattedDate = date.toLocaleDateString('es-ES');
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Generado el ${formattedDate} - Planificador de Comidas Saludables`, 105, 200, { align: 'center' });

        doc.save('Planificador_Comidas_' + formattedDate.replace(/\//g, '-') + '.pdf');
    }).catch(error => {
        console.error('Error al generar el PDF:', error);
        alert('Ocurrió un error al generar el PDF. Por favor intenta nuevamente.');
    });
}