/*
 * SPDX-FileCopyrightText: 2020 SAP SE or an SAP affiliate company <alexander.gilin@sap.com>
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import { expect, assert } from 'chai';
import * as index from '../src/index';
import * as serviceUtils from "../src/cfServicesUtil";
import * as sinon from "sinon";

describe("index package test", () => {
    let sandbox: any;
    let mockServiceUtils: any;


    before(() => {
        sandbox = sinon.createSandbox();
    });

    after(() => {
        sandbox.restore();
    });

    beforeEach(() => {
        mockServiceUtils = sandbox.mock(serviceUtils);
    });

    afterEach(() => {
        mockServiceUtils.verify();
    });


    it("types", () => {
        expect(index.OK).to.be.equal('OK');
    });

    it("cli", () => {
        expect(index.Cli).to.be.not.undefined;
    });

    it("messages", () => {
        expect(index.messages).to.be.not.undefined;
    });

    it("cf-SDK", () => {
        expect(index.cfLogin).to.be.not.undefined;
    });

    it("apiGetServicesInstancesFilteredByType", async () => {
        const serviceTypes = ['type1', 'type2'];
        const services = [{ label: 's1', serviceName: `${serviceTypes[0]}` }, { label: 's2', serviceName: `${serviceTypes[1]}` }];
        mockServiceUtils.expects("getServicesInstancesFilteredByType").withExactArgs(serviceTypes).resolves(services);
        assert.deepEqual(await index.apiGetServicesInstancesFilteredByType(serviceTypes), services);
    });

    it("apiGetInstanceCredentials", async () => {
        const name = "myInstance";
        const serviceKey = {
            binding: {
                env: "env",
                id: "id",
                type: "type",
                version: "v0.0.1"
            },
            catalogs: { data : "some data"},
            endpoints: {},
            preserve_host_header: false,
            "sap.cloud.service": "service",
            systemid: "systemid",
            uaa: {
                apiurl: "",
                clientid: "",
                clientsecret: "",
                identityzone: "",
                identityzoneid: "",
                sburl: "",
                tenantid: "",
                tenantmode: "",
                uaadomain: "",
                url: "",
                verificationkey: "",
                xsappname: ""
            },
            url: "url"
        };
        mockServiceUtils.expects("getInstanceCredentials").withExactArgs(name).resolves(serviceKey);
        assert.deepEqual(await index.apiGetInstanceCredentials(name), serviceKey);
    });

    it("apiCreateServiceInstance", async () => {
        const serviceType = 'type1';
        const servicePlan = "plan";
        const instanceName = "name";
        const config = { some : {}};
        const result = {data : {}};
        mockServiceUtils.expects("createServiceInstance").withExactArgs(serviceType, servicePlan, instanceName, config).resolves(result);
        assert.deepEqual(await index.apiCreateServiceInstance(serviceType, servicePlan, instanceName, config), result);
    });

    it("apiCreateServiceInstance", async () => {
        const instanceName = "name";
        const result = {data : {}};
        mockServiceUtils.expects("getInstanceMetadata").withExactArgs(instanceName).resolves(result);
        assert.deepEqual(await index.apiGetInstanceMetadata(instanceName), result);
    });
});
