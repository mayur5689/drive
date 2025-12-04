class FolderModel {
  final String id;
  final String userId;
  final String name;
  final String? parentId;
  final DateTime createdAt;

  FolderModel({
    required this.id,
    required this.userId,
    required this.name,
    this.parentId,
    required this.createdAt,
  });

  factory FolderModel.fromJson(Map<String, dynamic> json) {
    return FolderModel(
      id: json['id'] as String,
      userId: json['user_id'] as String,
      name: json['name'] as String,
      parentId: json['parent_id'] as String?,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'name': name,
      'parent_id': parentId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}

