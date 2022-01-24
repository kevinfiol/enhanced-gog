import { bundle } from './bundle.js';
import { annotate } from './annotate.js';

bundle({
    sourcemap: true,
    watch: {
        onRebuild(error) {
            if (error) console.error(error);
            else {
                annotate();
                console.log('Bundled!');
            }
        }
    }
})
.then(annotate)
.catch((error) => {
    console.error(error)
    process.exit(1);
});