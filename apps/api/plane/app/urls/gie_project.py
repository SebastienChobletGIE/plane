# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# GIE: routes des caractéristiques de projet.
from django.urls import path

from plane.app.views.gie_project import (
    ProjectCharacteristicActivityEndpoint,
    ProjectCharacteristicsEndpoint,
    ProjectPriorityDetailEndpoint,
    ProjectPriorityEndpoint,
    ProjectStatusDetailEndpoint,
    ProjectStatusEndpoint,
    ProjectStatusMarkDefaultEndpoint,
)

urlpatterns = [
    path("workspaces/<str:slug>/project-statuses/", ProjectStatusEndpoint.as_view(), name="gie-project-statuses"),
    path(
        "workspaces/<str:slug>/project-statuses/<uuid:pk>/",
        ProjectStatusDetailEndpoint.as_view(),
        name="gie-project-status",
    ),
    path(
        "workspaces/<str:slug>/project-statuses/<uuid:pk>/mark-default/",
        ProjectStatusMarkDefaultEndpoint.as_view(),
        name="gie-project-status-mark-default",
    ),
    path("workspaces/<str:slug>/project-priorities/", ProjectPriorityEndpoint.as_view(), name="gie-project-priorities"),
    path(
        "workspaces/<str:slug>/project-priorities/<uuid:pk>/",
        ProjectPriorityDetailEndpoint.as_view(),
        name="gie-project-priority",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/characteristics/",
        ProjectCharacteristicsEndpoint.as_view(),
        name="gie-project-characteristics",
    ),
    path(
        "workspaces/<str:slug>/projects/<uuid:project_id>/characteristics/activities/",
        ProjectCharacteristicActivityEndpoint.as_view(),
        name="gie-project-characteristic-activities",
    ),
]
