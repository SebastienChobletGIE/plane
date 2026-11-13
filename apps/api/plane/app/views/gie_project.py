# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# GIE: caractéristiques des projets.
# - listes de statuts et de priorités de projet, communes à l'espace de travail (écriture : admin de l'espace) ;
# - saisie des valeurs d'un projet par tout membre du projet, avec historique des modifications.

# Django imports
from django.db import IntegrityError, transaction
from django.db.models import Count, IntegerField, OuterRef, Subquery, Value
from django.db.models.functions import Coalesce

# Third party imports
from rest_framework import serializers, status
from rest_framework.response import Response

# Module imports
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.base import BaseSerializer
from plane.app.views.base import BaseAPIView
from plane.db.models import (
    Issue,
    Project,
    ProjectCharacteristicActivity,
    ProjectPriority,
    ProjectStatus,
    ProjectStatusGroup,
    Workspace,
)

# Statuts créés à la première ouverture de la liste, sur le modèle des statuts par défaut des work items.
DEFAULT_PROJECT_STATUSES = [
    {"name": "Backlog", "color": "#60646C", "sequence": 15000, "group": ProjectStatusGroup.BACKLOG, "default": True},
    {"name": "Todo", "color": "#60646C", "sequence": 25000, "group": ProjectStatusGroup.UNSTARTED},
    {"name": "In Progress", "color": "#F59E0B", "sequence": 35000, "group": ProjectStatusGroup.STARTED},
    {"name": "Done", "color": "#46A758", "sequence": 45000, "group": ProjectStatusGroup.COMPLETED},
    {"name": "Cancelled", "color": "#9AA4BC", "sequence": 55000, "group": ProjectStatusGroup.CANCELLED},
]

# Champs saisis par les membres du projet. L'avancement est calculé, il n'est pas ici.
CHARACTERISTIC_FIELDS = [
    "project_status",
    "project_priority",
    "estimated_delivery_date",
    "is_copil",
    "remaining_work",
]


def ensure_default_project_statuses(workspace):
    """Crée les statuts par défaut si l'espace de travail n'en a jamais eu (supprimés compris)."""
    if ProjectStatus.all_objects.filter(workspace=workspace).exists():
        return
    ProjectStatus.objects.bulk_create(
        [ProjectStatus(workspace=workspace, **{"default": False, **item}) for item in DEFAULT_PROJECT_STATUSES]
    )


def get_default_project_status(workspace):
    ensure_default_project_statuses(workspace)
    return ProjectStatus.objects.filter(workspace=workspace, default=True).first()


def annotate_project_progress(queryset):
    """Ajoute le nombre de work items terminés et le total servant au calcul de l'avancement.

    Total = work items non supprimés, hors brouillons et hors triage, archivés compris, sous-tâches comprises,
    moins les work items annulés.
    """
    base = Issue.objects.filter(project_id=OuterRef("pk"), is_draft=False).exclude(state__group="triage")

    def count_subquery(qs):
        return Coalesce(
            Subquery(
                qs.order_by().values("project_id").annotate(c=Count("id")).values("c")[:1],
                output_field=IntegerField(),
            ),
            Value(0),
        )

    return queryset.annotate(
        progress_total_count=count_subquery(base.exclude(state__group="cancelled")),
        progress_completed_count=count_subquery(base.filter(state__group="completed")),
    )


class ProjectStatusSerializer(BaseSerializer):
    class Meta:
        model = ProjectStatus
        fields = ["id", "name", "description", "color", "group", "sequence", "default", "workspace"]
        read_only_fields = ["workspace", "default"]


class ProjectPrioritySerializer(BaseSerializer):
    class Meta:
        model = ProjectPriority
        fields = ["id", "name", "color", "sequence", "workspace"]
        read_only_fields = ["workspace"]


class ProjectCharacteristicActivitySerializer(BaseSerializer):
    class Meta:
        model = ProjectCharacteristicActivity
        fields = ["id", "project", "actor", "field", "verb", "old_value", "new_value", "created_at"]


def _name_taken(model_label):
    return Response({"name": f"The {model_label} name is already taken"}, status=status.HTTP_400_BAD_REQUEST)


class ProjectStatusEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        ensure_default_project_statuses(workspace)
        statuses = ProjectStatus.objects.filter(workspace=workspace)
        return Response(ProjectStatusSerializer(statuses, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ProjectStatusSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                serializer.save(workspace=workspace)
        except IntegrityError:
            return _name_taken("status")
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectStatusDetailEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        project_status = ProjectStatus.objects.get(pk=pk, workspace__slug=slug)
        serializer = ProjectStatusSerializer(project_status, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            return _name_taken("status")
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        project_status = ProjectStatus.objects.get(pk=pk, workspace__slug=slug)
        if project_status.default:
            return Response(
                {"error": "The default project status cannot be deleted"}, status=status.HTTP_400_BAD_REQUEST
            )
        if Project.objects.filter(project_status=project_status).exists():
            return Response(
                {"error": "The project status is used by at least one project"}, status=status.HTTP_400_BAD_REQUEST
            )
        project_status.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectStatusMarkDefaultEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug, pk):
        with transaction.atomic():
            ProjectStatus.objects.filter(workspace__slug=slug, default=True).update(default=False)
            ProjectStatus.objects.filter(workspace__slug=slug, pk=pk).update(default=True)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectPriorityEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def get(self, request, slug):
        priorities = ProjectPriority.objects.filter(workspace__slug=slug)
        return Response(ProjectPrioritySerializer(priorities, many=True).data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def post(self, request, slug):
        workspace = Workspace.objects.get(slug=slug)
        serializer = ProjectPrioritySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                serializer.save(workspace=workspace)
        except IntegrityError:
            return _name_taken("priority")
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProjectPriorityDetailEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def patch(self, request, slug, pk):
        priority = ProjectPriority.objects.get(pk=pk, workspace__slug=slug)
        serializer = ProjectPrioritySerializer(priority, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        try:
            with transaction.atomic():
                serializer.save()
        except IntegrityError:
            return _name_taken("priority")
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission([ROLE.ADMIN], level="WORKSPACE")
    def delete(self, request, slug, pk):
        priority = ProjectPriority.objects.get(pk=pk, workspace__slug=slug)
        if Project.objects.filter(project_priority=priority).exists():
            return Response(
                {"error": "The project priority is used by at least one project"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        priority.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProjectCharacteristicsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = CHARACTERISTIC_FIELDS

    def validate_project_status(self, value):
        if value is not None and value.workspace_id != self.instance.workspace_id:
            raise serializers.ValidationError("Invalid project status")
        return value

    def validate_project_priority(self, value):
        if value is not None and value.workspace_id != self.instance.workspace_id:
            raise serializers.ValidationError("Invalid project priority")
        return value


def _activity_value(project, field):
    """Valeur lisible enregistrée dans l'historique (nom du statut / de la priorité au moment du changement)."""
    value = getattr(project, field)
    if value is None:
        return None
    if field in ("project_status", "project_priority"):
        return value.name
    if field == "is_copil":
        return "true" if value else "false"
    if field == "estimated_delivery_date":
        return value.isoformat()
    return value if value != "" else None


class ProjectCharacteristicsEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER])
    def patch(self, request, slug, project_id):
        project = Project.objects.get(pk=project_id, workspace__slug=slug)
        if project.archived_at:
            return Response({"error": "Archived projects cannot be updated"}, status=status.HTTP_400_BAD_REQUEST)

        data = {key: value for key, value in request.data.items() if key in CHARACTERISTIC_FIELDS}
        old_values = {field: _activity_value(project, field) for field in data}

        serializer = ProjectCharacteristicsSerializer(project, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            serializer.save()
            activities = []
            for field in data:
                new_value = _activity_value(project, field)
                if new_value == old_values[field]:
                    continue
                activities.append(
                    ProjectCharacteristicActivity(
                        workspace_id=project.workspace_id,
                        project=project,
                        actor=request.user,
                        field=field,
                        verb="removed" if new_value is None else "updated",
                        old_value=old_values[field],
                        new_value=new_value,
                        created_by=request.user,
                    )
                )
            ProjectCharacteristicActivity.objects.bulk_create(activities)

        return Response({field: serializer.data[field] for field in CHARACTERISTIC_FIELDS}, status=status.HTTP_200_OK)


class ProjectCharacteristicActivityEndpoint(BaseAPIView):
    @allow_permission([ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST])
    def get(self, request, slug, project_id):
        activities = ProjectCharacteristicActivity.objects.filter(project_id=project_id, workspace__slug=slug).order_by(
            "-created_at"
        )
        return Response(ProjectCharacteristicActivitySerializer(activities, many=True).data, status=status.HTTP_200_OK)
