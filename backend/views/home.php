<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($app) ?> API</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
</head>
<body class="bg-light">
<div class="container py-5">
    <div class="p-4 p-md-5 bg-white rounded-3 shadow-sm">
        <h1 class="h3 mb-3"><?= htmlspecialchars($app) ?> API</h1>
        <p class="text-muted mb-4">Version <?= htmlspecialchars($version ?? '') ?>. Use the links below to explore or test the endpoints.</p>
        <ul class="list-group mb-4">
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>/api/users</span>
                <span class="badge bg-primary">CRUD</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>/api/teams</span>
                <span class="badge bg-primary">CRUD</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>/api/companies</span>
                <span class="badge bg-primary">CRUD</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>/api/reports</span>
                <span class="badge bg-primary">CRUD</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>/api/pickups</span>
                <span class="badge bg-primary">CRUD</span>
            </li>
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span>/api/team-applications</span>
                <span class="badge bg-primary">CRUD</span>
            </li>
        </ul>
        <a class="btn btn-dark" href="/docs">View Swagger Docs</a>
        <a class="btn btn-outline-secondary" href="/health">Health Check</a>
    </div>
</div>
</body>
</html>
