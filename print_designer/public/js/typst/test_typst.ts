// Has to be loaded by App.vue
import { exportTypstPdf } from './using_typst';

exportTypstPdf('#text("Hello, Typst from Vite + $typst.pdf()!")');