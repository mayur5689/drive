import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final SupabaseClient _supabase = Supabase.instance.client;
  UserModel? _user;
  bool _isLoading = true;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    _init();
  }

  Future<void> _init() async {
    _checkUser();
    _supabase.auth.onAuthStateChange.listen((data) {
      _checkUser();
    });
  }

  Future<void> _checkUser() async {
    final session = _supabase.auth.currentSession;
    if (session != null) {
      final userData = _supabase.auth.currentUser;
      _user = UserModel(
        id: userData!.id,
        email: userData.email,
        name: userData.userMetadata?['name'],
      );
    } else {
      _user = null;
    }
    _isLoading = false;
    notifyListeners();
  }

  Future<String?> signUp(String email, String password, String? name) async {
    try {
      final response = await _supabase.auth.signUp(
        email: email,
        password: password,
        data: name != null ? {'name': name} : null,
        emailRedirectTo: null, // For email confirmation
      );
      
      // Check if email confirmation is required
      if (response.user != null && response.session == null) {
        // Email confirmation required
        return 'Please check your email to verify your account before signing in.';
      }
      
      if (response.user != null && response.session != null) {
        // Auto-logged in (if email confirmation disabled)
        _user = UserModel(
          id: response.user!.id,
          email: response.user!.email,
          name: name,
        );
        notifyListeners();
        return null; // Success, no message needed
      }
      
      return 'Account created. Please check your email to verify.';
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signIn(String email, String password) async {
    try {
      final response = await _supabase.auth.signInWithPassword(
        email: email,
        password: password,
      );
      
      if (response.user != null) {
        _user = UserModel(
          id: response.user!.id,
          email: response.user!.email,
          name: response.user!.userMetadata?['name'],
        );
        notifyListeners();
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<void> signOut() async {
    await _supabase.auth.signOut();
    _user = null;
    notifyListeners();
  }

  Future<void> resetPassword(String email) async {
    await _supabase.auth.resetPasswordForEmail(email);
  }
}

