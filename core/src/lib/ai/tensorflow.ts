import { layers, loadLayersModel, sequential, Sequential, tidy, train } from "@tensorflow/tfjs";
import { getQuoteTestData, getRealQuoteTestData } from "./QuoteTestData";

const LEARNING_RATE = 0.1;

export async function trainLinearRegression() {
	// Define a simple model.
	const model = sequential();
	model.add(layers.dense({ inputShape: [12], units: 10 }));
	model.add(layers.dense({ units: 1 }));

	model.summary();

	console.log("compiling model");
	model.compile({
		optimizer: train.sgd(LEARNING_RATE),
		loss: "meanSquaredError",
		metrics: ["mse"],
	});

	console.log("getting training data");
	const { input_tensors, output_tensors } = await getRealQuoteTestData();
	console.log(input_tensors.toString(), output_tensors.toString());
	console.log("training model");
	// Train the model.
	const results = await model.fit(input_tensors.normalized, output_tensors.normalized, {
		epochs: 100,
		callbacks: {
			onEpochEnd: (epoch, logs) => {
				console.log("Epoch: ", epoch, " Loss: ", logs?.loss);
			},
		},
	});

	console.log("\nAverage mean squared error: ", results.history.mse[results.history.mse.length - 1]);

	console.log("\ntesting model");
	const test_data = await getRealQuoteTestData(10);

	const [x, y, preds] = tidy(() => {
		const preds = model.predict(test_data.input_tensors.normalized);

		console.log("preds: ", preds.toString());
		const unNormXs = test_data.input_tensors.normalized
			.mul(test_data.input_tensors.max.sub(test_data.input_tensors.min))
			.add(test_data.input_tensors.min);

		const unNormYs = test_data.output_tensors.normalized
			.mul(test_data.output_tensors.max.sub(test_data.output_tensors.min))
			.add(test_data.output_tensors.min);

		const unNormPreds = (preds as any)
			.mul(test_data.output_tensors.max.sub(test_data.output_tensors.min))
			.add(test_data.output_tensors.min);

		// Un-normalize the data
		return [unNormXs.dataSync(), unNormYs.dataSync(), unNormPreds.dataSync()];
	});

	const xs = [];
	for (let i = 0; i < x.length; i += 2) {
		xs.push([x[i], x[i + 1]]);
	}

	for (let i = 0; i < xs.length; i++) {
		const quote = xs[i];
		console.log(`Prediction: ${preds[i]}, Actual: ${y[i]}\n`);
	}

	console.log("done");
}

export async function runLinearRegression() {
	const model = (await loadLayersModel("./linear-regression.keras")) as Sequential;
	const { input_tensors } = getQuoteTestData(1000);
	const quote = model.predict(input_tensors.normalized);
	console.log(quote);
}

trainLinearRegression();
// getRealQuoteTestData(10);
