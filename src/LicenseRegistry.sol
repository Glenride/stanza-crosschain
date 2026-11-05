// SPDX-License-Identifier: MIT
// DRAFT for the NEAR Build Beyond Boundaries hackathon block Thu Nov 5, 2026, 10:00 AM-12:00 PM ET.
// Source spec: near-build-scope-nov1-14.md + repo-skeleton-plan.md (see NOTES.md).
// NOT deployed, NOT submitted, NOT the submission repo. Relayer is a constructor
// argument on purpose: it must be the NEAR Chain Signatures derived address
// (derivation path ethereum-1), which is not on file yet. Do not hardcode a guess.
pragma solidity ^0.8.24;

contract LicenseRegistry {
    address public immutable relayer;

    struct Work {
        address scholar;
        string metadataUri;
        bool exists;
    }

    mapping(bytes32 => Work) public works;
    mapping(bytes32 => bool) public settled;

    event WorkRegistered(bytes32 indexed workId, address indexed scholar, string metadataUri);
    event LicenseRecorded(
        bytes32 indexed workId,
        address indexed buyer,
        string tier,
        bytes32 indexed proofHash,
        address scholar
    );
    event ScholarCredited(bytes32 indexed workId, address indexed scholar, string tier);

    error NotRelayer();
    error AlreadySettled();
    error UnknownWork();

    constructor(address _relayer) {
        relayer = _relayer;
    }

    function registerWork(bytes32 workId, address scholar, string calldata metadataUri) external {
        works[workId] = Work({scholar: scholar, metadataUri: metadataUri, exists: true});
        emit WorkRegistered(workId, scholar, metadataUri);
    }

    function recordLicense(
        address buyer,
        bytes32 workId,
        string calldata tier,
        bytes32 proofHash
    ) external {
        if (msg.sender != relayer) revert NotRelayer();
        if (settled[proofHash]) revert AlreadySettled();
        Work memory work = works[workId];
        if (!work.exists) revert UnknownWork();

        settled[proofHash] = true;
        emit LicenseRecorded(workId, buyer, tier, proofHash, work.scholar);
        // STANZA credit is recognition only (per frozen spec): recorded here as an
        // event + on-chain record, NOT a token transfer. If the demo needs an actual
        // STANZA transfer, that is a separate, explicit decision before deploy.
        emit ScholarCredited(workId, work.scholar, tier);
    }
}
