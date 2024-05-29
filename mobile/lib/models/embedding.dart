import "dart:convert";

import "package:ml_linalg/vector.dart";

class Embedding {
  final int fileID;
  final Model model;
  final List<double> embedding;
  int? updationTime;

  Embedding({
    required this.fileID,
    required this.model,
    required this.embedding,
    this.updationTime,
  });

  static List<double> decodeEmbedding(String embedding) {
    return List<double>.from(jsonDecode(embedding) as List);
  }

  static String encodeEmbedding(List<double> embedding) {
    return jsonEncode(embedding);
  }
}

class EmbeddingVector {
  final int fileID;
  final Model model;
  final Vector embedding;
  int? updationTime;

  EmbeddingVector({
    required this.fileID,
    required this.model,
    required this.embedding,
    this.updationTime,
  });

  static Vector decodeEmbedding(String embedding) {
    return Vector.fromList(List<double>.from(jsonDecode(embedding) as List));
  }

  static String encodeEmbedding(Vector embedding) {
    return jsonEncode(embedding.toList());
  }
}

enum Model {
  onnxClip,
  ggmlClip,
}

extension ModelExtension on Model {
  String get name => serialize(this);
}

String serialize(Model model) {
  switch (model) {
    case Model.onnxClip:
      return 'onnx-clip';
    case Model.ggmlClip:
      return 'ggml-clip';
    default:
      throw Exception('$model is not a valid Model');
  }
}

Model deserialize(String model) {
  switch (model) {
    case 'onnx-clip':
      return Model.onnxClip;
    case 'ggml-clip':
      return Model.ggmlClip;
    default:
      throw Exception('$model is not a valid Model');
  }
}
