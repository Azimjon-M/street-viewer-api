const mongoose = require('mongoose');
const MiniMap = require('./src/models/MiniMap');

mongoose.connect('mongodb://localhost:27017/street-viewer', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const m = await MiniMap.findOne({});
        console.log('Scenes array:', m ? m.scenes : 'No minimap');

        const q1 = await MiniMap.findOne({ 'scenes.id': process.argv[2] });
        console.log('Query scenes.id =', process.argv[2], ':', !!q1);

        process.exit(0);
    })
    .catch(console.error);
