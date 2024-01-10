// Get the form and file field
		let form = document.querySelector('#upload');
		let file = document.querySelector('#file');
		let app = document.querySelector('#app');
		var albumBucketName = "awk-rekognition-project";
		var bucketRegion = "us-east-1";
		var IdentityPoolId = "us-east-1:8956197a-dc13-4b15-829f-127d2fe0cd92";
		
		AWS.config.update({
			region: bucketRegion,
			credentials: new AWS.CognitoIdentityCredentials({
			IdentityPoolId: IdentityPoolId
			})
		});
		
		// Create the DynamoDB service object

		var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});
		

		// create s3 service object
		var s3 = new AWS.S3({
			apiVersion: "2006-03-01",
			params: { Bucket: albumBucketName }
		});
		
		/**
		 * Log the uploaded file to the console
		 * @param {event} Event The file loaded event
		 */
		function logFile (event) {
			let str = event.target.result;
			let img = document.createElement('img');
			img.src = str;
			app.append(img);
			//console.log(str);
		}


		/**
		 * Handle submit events
		 * @param  {Event} event The event object
		 */
		function handleSubmit (event) {

			// Stop the form from reloading the page
			event.preventDefault();
			
			var myfile = file.files[0];
			var fileName = file.files.item(0).name;
			
			// If there's no file, do nothing
			if (!file.value.length) return;

			// Create a new FileReader() object
			let reader = new FileReader();

			// Setup the callback event to run when the file is read
			reader.onload = logFile;

			// Read the file
			reader.readAsDataURL(myfile);
			
			//Upload to s3
			var upload = new AWS.S3.ManagedUpload({
				params: {
				  Bucket: albumBucketName,
				  Key: fileName,
				  Body: myfile
				}
			});
			
			var promise = upload.promise();

		    promise.then(
				function(data) {
					alert("Successfully uploaded photo.");		
				},
				function(err) {
					return alert("There was an error uploading your photo: ", err.message);
				}
			);
			
			//Access dynamodb and retrieve labels
			
			
			
			var ddbParams = {
				TableName: 'RekognitionProjectTable',
				Key: {
					'fileName': {'S': fileName}
				},
				ProjectionExpression: 'labels'
			};
			
			setTimeout(function(){
				
				ddb.getItem(ddbParams, function(err, data){
							if (err){
								console.log("Error", err);
							} else {
								console.log("Success", data.Item);
								document.getElementsByName('display')[0].value=data.Item.labels.SS;
							}	
						});
			
			}, 2000);
			
			
			
			}
	
		// Listen for submit events
		form.addEventListener('submit', handleSubmit);
		