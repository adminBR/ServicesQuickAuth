from rest_framework import serializers

class addServiceSerializer(serializers.Serializer):
    image = serializers.CharField(required=True)
    name = serializers.CharField(required=True)
    ip = serializers.CharField(required=True)
    desc = serializers.CharField(required=True)
    
class updateServiceSerializer(serializers.Serializer):
    id = serializers.CharField(required=True)
    image = serializers.CharField(required=False)
    name = serializers.CharField(required=False)
    ip = serializers.CharField(required=False)
    desc = serializers.CharField(required=False)


