import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

const withDB = async (operations, res) => {

	try{
		const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true});
		const db = client.db('neuro-sec');

		await operations(db);

		client.close();
	}catch(error){
		res.status(500).json({ message: 'Error cannot connect to db', error});
	}

}


app.get('/api/tweets', async (req, res) => {

	withDB(async (db) => {
		const { id, text} = req.body;
	
		const tweetInfo = await db.collection('tweets').find({}).toArray();
		res.status(200).json(tweetInfo);

	}, res);

})


app.get('/api/terms/:name', async (req, res) => {

	withDB(async (db) => {
		const termName = req.params.name;

		const termInfo = await db.collection('terms').findOne({ name: termName});
		res.status(200).json(termInfo);


	}, res);
})

app.post('/api/terms/:name/upvote', async (req, res) => {

	withDB(async (db) => {
		const termName = req.params.name;

		const termInfo = await db.collection('terms').findOne({ name: termName });
				await db.collection('terms').updateOne({ name: termName }, {
					'$set': {
						upvotes: termInfo.upvotes + 1,

					},
				});

		const updatedTermInfo = await db.collection('terms').findOne({ name: termName });

		res.status(200).json(updatedTermInfo);
	}, res);

});

app.post('/api/terms/:name/add-comment', (req, res) => {
	const { username, text} = req.body;
	const termName = req.params.name;

	withDB(async (db) => {
        const termInfo = await db.collection('terms').findOne({ name: termName });
        await db.collection('terms').updateOne({ name: termName }, {
            '$set': {
                comments: termInfo.comments.concat({ username, text }),
            },
        });
        
        const updatedTermInfo = await db.collection('terms').findOne({ name: termName });

        res.status(200).json(updatedTermInfo);
    }, res);	

}); 

app.get('*', (req, res) => {
	res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));
