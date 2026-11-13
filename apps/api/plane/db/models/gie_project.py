# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# GIE: caractéristiques des projets (statut, priorité, date de livraison, COPIL, reste à faire).
# Les statuts et priorités de projet sont communs à tous les projets d'un espace de travail.

# Django imports
from django.conf import settings
from django.db import models
from django.db.models import Q

# Module imports
from .base import BaseModel


class ProjectStatusGroup(models.TextChoices):
    BACKLOG = "backlog", "Backlog"
    UNSTARTED = "unstarted", "Unstarted"
    STARTED = "started", "Started"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class ProjectStatus(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="gie_project_statuses")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    color = models.CharField(max_length=255)
    group = models.CharField(choices=ProjectStatusGroup.choices, default=ProjectStatusGroup.BACKLOG, max_length=20)
    sequence = models.FloatField(default=65535)
    default = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="gie_project_status_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Status"
        verbose_name_plural = "Project Statuses"
        db_table = "gie_project_statuses"
        ordering = ("sequence",)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self._state.adding:
            last = ProjectStatus.objects.filter(workspace_id=self.workspace_id).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            if last is not None:
                self.sequence = last + 15000
        return super().save(*args, **kwargs)


class ProjectPriority(BaseModel):
    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="gie_project_priorities")
    name = models.CharField(max_length=255)
    color = models.CharField(max_length=255, blank=True)
    sequence = models.FloatField(default=65535)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=Q(deleted_at__isnull=True),
                name="gie_project_priority_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Project Priority"
        verbose_name_plural = "Project Priorities"
        db_table = "gie_project_priorities"
        ordering = ("sequence",)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self._state.adding:
            last = ProjectPriority.objects.filter(workspace_id=self.workspace_id).aggregate(
                largest=models.Max("sequence")
            )["largest"]
            if last is not None:
                self.sequence = last + 15000
        return super().save(*args, **kwargs)


class ProjectCharacteristicActivity(BaseModel):
    """Historique des modifications des caractéristiques d'un projet."""

    workspace = models.ForeignKey("db.Workspace", on_delete=models.CASCADE, related_name="gie_project_activities")
    project = models.ForeignKey("db.Project", on_delete=models.CASCADE, related_name="gie_project_activities")
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name="gie_project_activities"
    )
    field = models.CharField(max_length=255)
    verb = models.CharField(max_length=255, default="updated")
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "Project Characteristic Activity"
        verbose_name_plural = "Project Characteristic Activities"
        db_table = "gie_project_activities"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.project_id} {self.field}"
