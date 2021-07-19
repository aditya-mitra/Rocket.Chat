import { expect } from "chai";

import {
	getCredentials,
	api,
	request,
	credentials,
} from "../../data/api-data.js";

/**
 * @typedef {Object} OutOfOfficeData
 * @property {boolean} isEnabled
 * @property {string} customMessage
 * @property {string[]} roomIds
 * @property {string} startDate
 * @property {string} endDate
 */

/**
 * @param {OutOfOfficeData} outOfOfficeData
 * @returns {OutOfOfficeData}
 */
const generateOutOfOfficeData = (outOfOfficeData = {}) => {
	const isEnabled = outOfOfficeData.isEnabled
		? outOfOfficeData.isEnabled
		: true;
	const roomIds = outOfOfficeData.roomIds
		? outOfOfficeData.roomIds
		: ["GENERAL"];
	const customMessage =
		typeof outOfOfficeData.customMessage === "string"
			? outOfOfficeData.customMessage
			: "Hello, I am currently out of office!";
	const startDate = outOfOfficeData.startDate
		? outOfOfficeData.startDate
		: new Date().toISOString();

	let endDate = outOfOfficeData.endDate;
	if (!outOfOfficeData.endDate) {
		const endDateObject = new Date();
		endDateObject.setHours(endDateObject.getHours() + 1);
		endDate = endDateObject.toISOString();
	}

	return {
		startDate,
		endDate,
		isEnabled,
		roomIds,
		customMessage,
	};
};

describe("[OutOfOffice]", function () {
	this.retries(0);

	before((done) => getCredentials(done));

	// only for debugging
	// TODO - but there needs to a permenant method
	after((done) => {
		request.get(api("outOfOffice.removeAll")).expect(200).end(done);
	});

	describe("[/outOfOffice.toggle]", () => {
		it("cannot be enabled if the user is unauthenticated", (done) => {
			request
				.post(api("outOfOffice.toggle"))
				.send(generateOutOfOfficeData())
				.expect(401)
				.end(done);
		});

		it('cannot be enabled if the "customMessage" is empty', (done) => {
			request
				.post(api("outOfOffice.toggle"))
				.set(credentials)
				.send(generateOutOfOfficeData({ customMessage: "" }))
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property("success", false);
				})
				.end(done);
		});

		// TODO - I DO NOT THINK THIS IS REQUIRED
		it('cannot be enabled if "isEnabled" field is missing', (done) => {
			const outOfOfficeData = generateOutOfOfficeData();
			delete outOfOfficeData.isEnabled;
			request
				.post(api("outOfOffice.toggle"))
				.set(credentials)
				.send(outOfOfficeData)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property("success", false);
				})
				.end(done);
		});

		it('cannot be enabled if "startDate" and "endDate" are invalid ', (done) => {
			request
				.post(api("outOfOffice.toggle"))
				.set(credentials)
				.send(
					generateOutOfOfficeData({
						startDate: "invalid-start-date",
						endDate: "invalid-end-date",
					})
				)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property("success", false);
				})
				.end(done);
		});

		it('cannot be enabled if "startDate" is after the "endDate"', (done) => {
			const startDateObject = new Date();
			const endDateObject = new Date();
			endDateObject.setHours(endDateObject.getHours() - 1);

			request
				.post(api("outOfOffice.toggle"))
				.set(credentials)
				.send(
					generateOutOfOfficeData({
						startDate: startDateObject.toISOString(),
						endDate: endDateObject.toISOString(),
					})
				)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property("success", false);
				})
				.end(done);
		});

		// TODO - check for this validation
		it.skip('cannot be enabled if "startDate" is before the current date', (done) => {
			const outOfOfficeData = generateOutOfOfficeData();
			const startDateObject = new Date();
			startDateObject.setDate(startDateObject.getHours() - 1);

			outOfOfficeData.startDate = startDateObject.toISOString();

			request
				.post(api("outOfOffice.toggle"))
				.set(credentials)
				.send(outOfOfficeData)
				.expect(400)
				.expect((res) => {
					expect(res.body).to.have.property("success", false);
				})
				.end(done);
		});

		it("has a message when successfully enabled", (done) => {
			request
				.post(api("outOfOffice.toggle"))
				.set(credentials)
				.send(generateOutOfOfficeData())
				.expect(200)
				.expect("Content-Type", "application/json")
				.expect((res) => {
					expect(res.body).to.have.property("success", true);
					expect(res.body).to.have.property("message");
				})
				.end(done);
		});

		it.skip("cannot be disabled if it is already disabled", (done) => {
			done();
		});
	});

	describe("[/outOfOffice.status]", () => {});
});
