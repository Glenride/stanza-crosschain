// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/LicenseRegistry.sol";

contract LicenseRegistryTest is Test {
    LicenseRegistry registry;
    address relayer = address(0xA11CE);
    address scholar = address(0x5C10);
    address buyer = address(0xB00);
    bytes32 workId = keccak256("demo-work-1");
    bytes32 proof = keccak256("1click-deposit-tx-1");

    function setUp() public {
        registry = new LicenseRegistry(relayer);
        registry.registerWork(workId, scholar, "ipfs://demo-work-1");
    }

    function testRecordLicenseByRelayer() public {
        vm.prank(relayer);
        registry.recordLicense(buyer, workId, "read", proof);
        assertTrue(registry.settled(proof));
    }

    function testNonRelayerReverts() public {
        vm.prank(buyer);
        vm.expectRevert(LicenseRegistry.NotRelayer.selector);
        registry.recordLicense(buyer, workId, "read", proof);
    }

    function testReplayReverts() public {
        vm.prank(relayer);
        registry.recordLicense(buyer, workId, "read", proof);
        vm.prank(relayer);
        vm.expectRevert(LicenseRegistry.AlreadySettled.selector);
        registry.recordLicense(buyer, workId, "read", proof);
    }

    function testUnknownWorkReverts() public {
        vm.prank(relayer);
        vm.expectRevert(LicenseRegistry.UnknownWork.selector);
        registry.recordLicense(buyer, keccak256("nope"), "read", proof);
    }
}
