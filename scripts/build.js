import { bundle } from './bundle.js';
import { annotate } from './annotate.js';

bundle()
.then(annotate)
.then(() => {
    console.log('Bundled!');
})
.catch((error) => {
    console.error(error);
    process.exit(1);
});