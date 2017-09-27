const hello = require('./handlers/hello');
const jobLoad = require('./handlers/jobload');
const recipes = require('./handlers/recipes');
const recipeTypes = require('./handlers/recipeTypes');
const recipeDetails = require('./handlers/recipeDetails');
const jobs = require('./handlers/jobs');
const runningJobs = require('./handlers/runningJobs');
const jobTypes = require('./handlers/jobTypes');
const jobTypesValidate = require('./handlers/jobTypesValidate');
const jobTypesStatus = require('./handlers/jobTypesStatus');
const jobDetails = require('./handlers/jobDetails');
const jobTypeDetails = require('./handlers/jobTypeDetails');
const recipeTypeDetails = require('./handlers/recipeTypeDetails');
const workspaces = require('./handlers/workspaces');
const sources = require('./handlers/sources');
const sourceDetails = require('./handlers/sourceDetails');
const sourceDescendants = require('./handlers/sourceDescendants');
const metrics = require('./handlers/metrics');
const metricsDataTypes = require('./handlers/metricsDataTypeOptions');
const metricsPlotData = require('./handlers/metricsPlotData');
const jobExecutionLogs = require('./handlers/jobExecutionLogs');
const jobExecution = require('./handlers/jobExecution');

module.exports = {
    init: function(server) {
        server.route({
            method: 'GET',
            path: '/mocks/hello',
            handler: hello
        });

        server.route({
            method: 'GET',
            path: '/mocks/jobload',
            handler: jobLoad
        });

        server.route({
            method: 'GET',
            path: '/mocks/recipes',
            handler: recipes
        });

        server.route({
            method: 'GET',
            path: '/mocks/recipe-types',
            handler: recipeTypes
        });

        server.route({
            method: 'GET',
            path: '/mocks/recipes/{id}',
            handler: recipeDetails
        });

        server.route({
            method: 'GET',
            path: '/mocks/recipe-types/{id}',
            handler: recipeTypeDetails
        });

        server.route({
            method: 'GET',
            path: '/mocks/jobs',
            handler: jobs
        });

        server.route({
            method: 'GET',
            path: '/mocks/jobs/{id}',
            handler: jobDetails
        });

        server.route({
            method: 'GET',
            path: '/mocks/running-jobs',
            handler: runningJobs
        });

        server.route({
            method: 'GET',
            path: '/mocks/job-types',
            handler: jobTypes
        });

        server.route({
            method: 'POST',
            path: '/mocks/job-types/validate',
            handler: jobTypesValidate
        });

        server.route({
            method: 'GET',
            path: '/mocks/job-types/status',
            handler: jobTypesStatus
        });

        server.route({
            method: 'GET',
            path: '/mocks/job-types/{id}',
            handler: jobTypeDetails
        });

        server.route({
            method: 'GET',
            path: '/mocks/workspaces',
            handler: workspaces
        });

        server.route({
            method: 'GET',
            path: '/mocks/sources',
            handler: sources
        });

        server.route({
            method: 'GET',
            path: '/mocks/sources/{id}',
            handler: sourceDetails
        });

        server.route({
            method: 'GET',
            path: '/mocks/sources/{id}/{type}',
            handler: sourceDescendants
        });

        server.route({
            method: 'GET',
            path: '/mocks/metrics',
            handler: metrics
        });

        server.route({
            method: 'GET',
            path: '/mocks/metrics/job-types',
            handler: metricsDataTypes
        });

        server.route({
            method: 'GET',
            path: '/mocks/metrics/ingest',
            handler: metricsDataTypes
        });

        server.route({
            method: 'GET',
            path: '/mocks/metrics/error-types',
            handler: metricsDataTypes
        });

        server.route({
            method: 'GET',
            path: '/mocks/metrics/{type}/plot-data',
            handler: metricsPlotData
        });

        server.route({
            method: 'GET',
            path: '/mocks/job-executions/{id}/logs/combined',
            handler: jobExecutionLogs
        });

        server.route({
            method: 'GET',
            path: '/mocks/job-executions/{id}',
            handler: jobExecution
        });
    }
};
