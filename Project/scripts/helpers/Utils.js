module.exports.getBorrowerSignature = async (borrower, amount, documentId) => {
	const messageHash = ethers.utils.solidityKeccak256(["uint", "uint"], [amount, documentId]);
	const messageBytes = ethers.utils.arrayify(messageHash);

	return await borrower.signMessage(messageBytes);
};

module.exports.getVerificatorSignature = async (verificator, borrowerSignature) => {
	const messageHash = ethers.utils.solidityKeccak256(["bytes"], [borrowerSignature]);
	const messageBytes = ethers.utils.arrayify(messageHash);

	return await verificator.signMessage(messageBytes);
};
